// backend/src/mentorados-candidatura/linkedin/linkedin-automation.ts
import fs from 'fs';
import path from 'path';
import { chromium, Page } from 'playwright';
import { CreateCandidaturaDto } from '../dto/create-candidatura.dto';

const DEBUG_DIR = path.resolve(process.cwd(), 'playwright-debug');
if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });

async function saveDebug(page: Page, name: string) {
  try {
    const ts = Date.now();
    await page
      .screenshot({
        path: path.join(DEBUG_DIR, `${name}-${ts}.png`),
        fullPage: true,
      })
      .catch(() => {});
    const html = await page.content();
    fs.writeFileSync(path.join(DEBUG_DIR, `${name}-${ts}.html`), html);
  } catch (err) {
    console.warn('Falha ao salvar debug:', err);
  }
}

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let total = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        total += distance;
        if (total > window.innerHeight * 3) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

/**
 * Tenta clicar em elementos que contenham qualquer um dos textos fornecidos.
 * Retorna true se clicar em algum elemento com sucesso.
 */
async function clickByTexts(page: Page, texts: string[]) {
  const normTexts = texts.map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (!normTexts.length) return false;

  // procura elementos de botão/links que normalmente representam ações
  const handles = await page.$$(
    'button, a, input[type="button"], input[type="submit"], div[role="button"]',
  );

  for (const h of handles) {
    try {
      // tenta pegar texto interno e aria-label / title
      const inner = (await h.innerText().catch(() => '')) || '';
      const aria = (await h.getAttribute('aria-label').catch(() => '')) || '';
      const title = (await h.getAttribute('title').catch(() => '')) || '';
      const value = (await h.getAttribute('value').catch(() => '')) || '';
      const txt = (inner + ' ' + aria + ' ' + title + ' ' + value)
        .toString()
        .toLowerCase();

      for (const t of normTexts) {
        if (txt.includes(t)) {
          // garante que o elemento é visível e clicável
          try {
            await h.scrollIntoViewIfNeeded();
            // esperar por estabilidade visual pequena
            await page.waitForTimeout(120);
            await h.click({ timeout: 5000 });
            return true;
          } catch {
            // tentar click via evaluate (fallback)
            try {
              await page.evaluate((el) => (el as HTMLElement).click(), h);
              return true;
            } catch {}
          }
        }
      }
    } catch {
      // ignora erros em elementos individuais
    }
  }

  return false;
}

function parseSalaryText(text: string | null): number | null {
  if (!text) return null;
  // extrai primeira ocorrência numérica
  const m = text.replace(/\s+/g, ' ').match(/(\d+(?:[\.,]\d{3})*(?:[.,]\d+)?)/);
  if (!m) return null;
  // remove pontos de separador de milhar e troca vírgula decimal por ponto
  const cleaned = m[0].replace(/\./g, '').replace(/,/g, '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * candidatarPorTipo
 * - Usa chromium.launchPersistentContext para manter sessão (userDataDir por mentoradoId)
 * - Faz busca por tipoVaga e tenta candidatar via "Easy Apply" / "Candidatar-se"
 * - Filtra empresas bloqueadas (checa URL e texto da página)
 * - Filtra por pretensão salarial quando possível
 */
export async function candidatarPorTipo(dto: CreateCandidaturaDto) {
  const userDataDir = path.resolve(
    process.cwd(),
    'playwright-user-data/default',
  );
  if (!fs.existsSync(userDataDir))
    fs.mkdirSync(userDataDir, { recursive: true });

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    slowMo: 60,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    viewport: { width: 1200, height: 900 },
  });

  try {
    const page = await context.newPage();

    // Certifica-se de que há sessão logada no LinkedIn
    await page.goto('https://www.linkedin.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const loggedIn =
      (await page.$('img.global-nav__me-photo')) ||
      (await page.$('a[data-control-name="identity_profile_photo"]')) ||
      (await page.$('a[href*="/feed/"]'));

    if (!loggedIn) {
      await saveDebug(page, 'not-logged-in');
      throw new Error(
        `Sessão não encontrada em ${userDataDir}. Abra o navegador com esse profile, faça login no LinkedIn e reexecute.`,
      );
    }

    // Monta a URL de busca (keywords)
    const q = encodeURIComponent(dto.tipoVaga ?? '');
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${q}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await autoScroll(page);
    await page.waitForTimeout(700);

    // coleta links de vagas - tenta combinar vários seletores possíveis
    const jobLinks = await page
      .$$eval(
        'a[href*="/jobs/view/"], a[data-control-name="job_card_result_link"], a.result-card__full-card-link, a.job-card-list__title',
        (els) =>
          Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).href))),
      )
      .catch(() => []);

    const blocks = (dto.empresasBloqueadas || [])
      .map((b) => b.toLowerCase().trim())
      .filter(Boolean);
    const filtered = (jobLinks || []).filter(
      (url: string) => !blocks.some((b) => url.toLowerCase().includes(b)),
    );

    if (!filtered.length) {
      await saveDebug(page, 'no-job-links-found');
      return { attempted: 0, applied: 0, message: 'Nenhuma vaga encontrada.' };
    }

    const applyTexts = [
      'easy apply',
      'candidatar-se',
      'apply',
      'inscreva-se',
      'enviar candidatura',
      'candidate-se',
      'candidatar',
    ];
    const submitTexts = [
      'send application',
      'submit application',
      'enviar',
      'submit',
      'enviar candidatura',
    ];
    const nextTexts = ['next', 'próximo', 'seguinte', 'continuar'];

    let applied = 0;
    const maxApply = Math.max(1, Math.min(50, dto.maxAplicacoes ?? 6)); // limites defensivos

    for (const url of filtered.slice(0, maxApply)) {
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // filtragem por empresa bloqueada também por conteúdo da página (nome)
        if (blocks.length) {
          const pageText =
            (await page.textContent('body').catch(() => '')) || '';
          if (blocks.some((b) => pageText.toLowerCase().includes(b))) {
            console.log(`[SKIP] empresa bloqueada (conteúdo): ${url}`);
            continue;
          }
        }

        // tenta extrair salário (se presente)
        let salaryText: string | null = null;
        const possibleSelectors = [
          '[data-test-salary]',
          '.salary',
          '.salary-snippet',
          '.salary-range',
          '.job-criteria__text',
          '.jobs-unified-top-card__job-insight',
          '.description',
        ];
        for (const sel of possibleSelectors) {
          const el = await page.$(sel);
          if (el) {
            const txt = (await el.innerText().catch(() => '')).trim();
            if (txt) {
              salaryText = txt;
              break;
            }
          }
        }
        if (!salaryText) {
          const bodyText =
            (await page.textContent('body').catch(() => '')) || '';
          const snippet = String(bodyText).match(/(R\$|BRL|\$)\s*\d[\d\.,\s]*/);
          if (snippet) salaryText = snippet[0];
        }
        const salary = salaryText ? parseSalaryText(salaryText) : null;

        if (salary && dto.pretensaoClt && salary < dto.pretensaoClt) {
          console.log(`[SKIP] fora da pretensão (salary=${salary}) -> ${url}`);
          continue;
        }

        // tenta clicar em botão de candidatura
        const clickedApply = await clickByTexts(page, applyTexts);
        if (!clickedApply) {
          console.log(`[NO APPLY] botão 'apply' não encontrado: ${url}`);
          await saveDebug(page, 'no-apply-button');
          continue;
        }

        await page.waitForTimeout(900);

        // tenta "Enviar" direto, senão percorre etapas com "Next" e tenta "Submit"
        let submitted = await clickByTexts(page, submitTexts);
        if (!submitted) {
          for (let i = 0; i < 5 && !submitted; i++) {
            const nextClicked = await clickByTexts(page, nextTexts);
            if (!nextClicked) break;
            await page.waitForTimeout(700);
            submitted = await clickByTexts(page, submitTexts);
            if (submitted) break;
          }
        }

        if (submitted) {
          applied++;
          console.log(`[APPLIED] ${url}`);
        } else {
          console.log(
            `[PARTIAL] formulário complexo ou submit não detectado: ${url}`,
          );
          await saveDebug(page, 'complex-form');
        }

        // espera entre aplicações para parecer humano
        await page.waitForTimeout(1500 + Math.floor(Math.random() * 1400));
      } catch (err) {
        console.error('Erro aplicando em URL:', url, err);
        await saveDebug(page, 'apply-error');
      }
    }

    return { attempted: filtered.length, applied };
  } catch (err) {
    console.error('Erro geral na automação:', err);
    throw err;
  } finally {
    try {
      await context.close();
    } catch {}
  }
}

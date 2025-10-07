// backend/src/mentorados-candidatura/linkedin/linkedin-automation.ts
import { chromium } from 'playwright';
import { CreateCandidaturaDto } from '../dto/create-candidatura.dto';

export async function candidatarLinkedIn(dto: CreateCandidaturaDto) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    await page.goto('https://www.linkedin.com/login');
    await page.fill('input[name="session_key"]', dto.linkedin);
    await page.fill('input[name="session_password"]', dto.senha);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Buscar vagas baseado no tipo e IA
    let searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(dto.tipoVaga || '')}`;
    await page.goto(searchUrl);
    await page.waitForTimeout(2000);

    // Pegar links das vagas na página (pode iterar mais páginas se quiser)
    const vagas = await page.$$eval('a.result-card__full-card-link', (els) =>
      els.map((el) => (el as HTMLAnchorElement).href)
    );

    for (const urlVaga of vagas) {
      // Ignorar empresas bloqueadas
      if (dto.empresasBloqueadas?.some((e) => urlVaga.includes(e))) continue;

      await page.goto(urlVaga);
      await page.waitForTimeout(2000);

      const candidatarBtn = await page.$('button:has-text("Candidatar-se")');
      if (!candidatarBtn) continue;

      await candidatarBtn.click();
      await page.waitForTimeout(1000);

      const enviarBtn = await page.$('button:has-text("Enviar")');
      if (enviarBtn) {
        await enviarBtn.click();
        await page.waitForTimeout(1000);
      }

      console.log(`Candidatura enviada para: ${urlVaga}`);
    }

  } catch (err) {
    console.error('Erro na automação do LinkedIn:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

// src/mentorados-candidatura/linkedin/linkedin-candidator.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface CandidaturaResult {
  success: boolean;
  jobTitle?: string;
  company?: string;
  applied: boolean;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class LinkedInCandidatorService {
  private readonly logger = new Logger(LinkedInCandidatorService.name);

  /**
   * AUTOMAÇÃO DIRETA - Login + Candidaturas em UM passo
   */
  async iniciarAutomacaoCompleta(config: {
    email: string;
    password: string;
    tipoVaga: string;
    empresasBloqueadas: string[];
    pretensaoClt?: number;
    pretensaoPj?: number;
    maxAplicacoes: number;
  }): Promise<{ success: boolean; results: CandidaturaResult[]; message: string }> {
    
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    const results: CandidaturaResult[] = [];

    try {
      this.logger.log('🚀 INICIANDO AUTOMAÇÃO COMPLETA...');

      // Abre navegador VISÍVEL
      browser = await chromium.launch({
        headless: false, // SEMPRE VISÍVEL
        slowMo: 100, // Movimentos lentos
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });

      // Cria contexto com viewport
      context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
      });

      const page = await context.newPage();

      // PASSO 1: LOGIN DIRETO
      this.logger.log('🔐 Fazendo login...');
      await page.goto('https://www.linkedin.com/login', { 
        waitUntil: 'load', 
        timeout: 30000 
      });
      await this.delay(2000);

      // Preenche email
      const emailInput = await page.$('#username');
      if (emailInput) {
        await emailInput.click({ delay: 100 });
        await page.keyboard.type(config.email, { delay: 100 });
      }
      await this.delay(1000);

      // Preenche senha
      const passwordInput = await page.$('#password');
      if (passwordInput) {
        await passwordInput.click({ delay: 100 });
        await page.keyboard.type(config.password, { delay: 100 });
      }
      await this.delay(1000);

      // Clica em entrar
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.click({ delay: 200 });
      }
      await this.delay(5000);

      // PASSO 2: IR PARA VAGAS
      this.logger.log('🔍 Indo para vagas...');
      await page.goto('https://www.linkedin.com/jobs/', { 
        waitUntil: 'load', 
        timeout: 30000 
      });
      await this.delay(3000);

      // PASSO 3: PESQUISAR VAGAS
      this.logger.log(`🔎 Pesquisando: ${config.tipoVaga}`);
      const searchInput = await page.$('input[aria-label*="Pesquisar cargo"]');
      
      if (searchInput) {
        await searchInput.click({ delay: 100 });
        await this.delay(1000);
        await page.keyboard.type(config.tipoVaga, { delay: 100 });
        await this.delay(1000);
        await page.keyboard.press('Enter');
        await this.delay(5000);
      }

      // PASSO 4: COLETAR VAGAS
      this.logger.log('📋 Coletando vagas...');
      await this.scrollLentamente(page);
      await this.delay(2000);

      const jobLinks = await page.$$eval(
        'a[href*="/jobs/view/"]', 
        (links: HTMLAnchorElement[]) => 
          links.slice(0, config.maxAplicacoes).map(link => ({
            url: link.href,
            title: link.textContent?.trim() || 'Vaga LinkedIn',
            company: 'Empresa'
          }))
      );

      this.logger.log(`🎯 ${jobLinks.length} vagas encontradas`);

      // PASSO 5: APLICAR PARA VAGAS
      for (let i = 0; i < jobLinks.length; i++) {
        const vaga = jobLinks[i];
        this.logger.log(`📝 Vaga ${i + 1}/${jobLinks.length}: ${vaga.title}`);
        
        const result = await this.aplicarParaVaga(page, vaga);
        results.push(result);
        await this.delay(4000);
      }

      const aplicacoesSucesso = results.filter(r => r.applied).length;
      
      return {
        success: true,
        results,
        message: `✅ Concluído: ${aplicacoesSucesso} aplicações`
      };

    } catch (error: any) {
      this.logger.error('Erro:', error);
      return {
        success: false,
        results: [],
        message: `❌ Erro: ${error.message}`
      };
    } finally {
      // Mantém navegador aberto
      this.logger.log('💻 Navegador mantido aberto');
      // Fecha apenas o contexto se existir
      if (context) {
        await context.close();
      }
    }
  }

  /**
   * APLICA PARA UMA VAGA
   */
  private async aplicarParaVaga(page: Page, vaga: {url: string, title: string, company: string}): Promise<CandidaturaResult> {
    const result: CandidaturaResult = {
      success: false,
      jobTitle: vaga.title,
      company: vaga.company,
      applied: false,
      timestamp: new Date()
    };

    try {
      // Abre vaga em nova guia
      await page.evaluate((url) => {
        window.open(url, '_blank');
      }, vaga.url);
      await this.delay(2000);

      // Muda para nova guia
      const pages = page.context().pages();
      const novaGuia = pages[pages.length - 1];
      await novaGuia.bringToFront();
      await this.delay(3000);

      // Clica em candidatar
      const botaoCandidatar = await novaGuia.$('.jobs-apply-button, button[data-control-name="jobdetails_topcard_inapply"]');
      
      if (botaoCandidatar) {
        await botaoCandidatar.hover();
        await this.delay(1000);
        await botaoCandidatar.click({ delay: 200 });
        await this.delay(3000);

        // Tenta enviar
        const botaoEnviar = await novaGuia.$('[aria-label="Submit application"], [aria-label="Enviar candidatura"]');
        if (botaoEnviar) {
          await botaoEnviar.hover();
          await this.delay(1000);
          await botaoEnviar.click({ delay: 200 });
          await this.delay(4000);
          result.success = true;
          result.applied = true;
        }

        // Fecha guia
        await novaGuia.close();
        await page.bringToFront();
      }

    } catch (error: any) {
      result.error = `Erro: ${error.message}`;
    }

    return result;
  }

  private async scrollLentamente(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let total = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 400);
          total += 400;
          if (total >= 2000) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    });
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
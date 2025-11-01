import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { chromium, Browser, Page } from 'playwright';
import { MentoradosService } from '../../mentorados/mentorados.service';
import { RespostasChatConfig } from '../dto/iniciar-automacao.dto';
import { VagaAplicada } from '../entities/vaga-aplicada.entity';

export interface CandidaturaResult {
  success: boolean;
  jobTitle?: string;
  company?: string;
  applied: boolean;
  error?: string;
  timestamp: Date;
  jobUrl?: string;
}

export interface AutomacaoConfig {
  email: string;
  password: string;
  tipoVaga: string;
  empresasBloqueadas: string[];
  maxAplicacoes: number;
  mentoradoId: string;
  respostasChat: RespostasChatConfig;
}

@Injectable()
export class LinkedInCandidatorService {
  private readonly logger = new Logger(LinkedInCandidatorService.name);
  private readonly vagasAplicadas = new Set<string>();

  constructor(
    private readonly mentoradosService: MentoradosService,
    @InjectRepository(VagaAplicada)
    private readonly vagaAplicadaRepository: Repository<VagaAplicada>,
  ) {}

  /**
   * AUTOMAÇÃO COMPATÍVEL DEV/PROD
   */
  async iniciarAutomacaoCompleta(config: AutomacaoConfig): Promise<{ success: boolean; results: CandidaturaResult[]; message: string }> {
    
    if (!config.mentoradoId || config.mentoradoId.trim() === '') {
      throw new BadRequestException('ID do mentorado é obrigatório');
    }

    let browser: Browser | null = null;
    const results: CandidaturaResult[] = [];

    try {
      this.logger.log('🚀 INICIANDO AUTOMAÇÃO LINKEDIN...');
      this.logger.log(`📋 Mentorado ID: ${config.mentoradoId}`);
      this.logger.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      this.logger.log(`🔧 Headless: ${process.env.NODE_ENV === 'production' ? 'true' : 'false'}`);

      // Limpa cache
      this.vagasAplicadas.clear();

      // Busca vagas aplicadas anteriormente
      const vagasAplicadasAnteriormente = await this.buscarVagasAplicadasAnteriormente(config.mentoradoId);
      this.logger.log(`📊 ${vagasAplicadasAnteriormente.length} vagas aplicadas em execuções anteriores`);

      vagasAplicadasAnteriormente.forEach(vaga => {
        this.vagasAplicadas.add(vaga.jobUrl);
      });

      // Busca mentorado
      let mentorado;
      try {
        mentorado = await this.mentoradosService.buscarPorId(config.mentoradoId);
        this.logger.log(`✅ Mentorado encontrado: ${mentorado.cargoObjetivo}`);
      } catch (error) {
        this.logger.error(`❌ Erro ao buscar mentorado: ${error.message}`);
        throw new NotFoundException(`Mentorado com ID ${config.mentoradoId} não encontrado`);
      }

      // 🔥 CONFIGURAÇÃO COMPATÍVEL DEV/PROD
      const launchOptions: any = {
        // Headless baseado no ambiente
        headless: process.env.NODE_ENV === 'production' ? true : false,
        
        // SlowMo apenas em desenvolvimento
        slowMo: process.env.NODE_ENV === 'production' ? 0 : 100,
        
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--window-size=1920,1080',
          '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        timeout: 120000
      };

      // 🔥 CONFIGURAÇÃO DE EXECUTABLE_PATH INTELIGENTE
      if (process.env.NODE_ENV === 'production' && process.env.CHROMIUM_PATH) {
        launchOptions.executablePath = process.env.CHROMIUM_PATH;
        this.logger.log(`🔧 Usando Chromium em: ${process.env.CHROMIUM_PATH}`);
      } else {
        this.logger.log('🔧 Playwright encontrará Chromium automaticamente');
      }

      browser = await chromium.launch(launchOptions);

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true
      });

      const page = await context.newPage();
      
      // Configurar timeouts
      page.setDefaultTimeout(120000);
      page.setDefaultNavigationTimeout(120000);

      // LOGIN
      this.logger.log('🔐 Realizando login no LinkedIn...');
      const loginSucesso = await this.realizarLoginUniversal(page, config.email, config.password);
      
      if (!loginSucesso) {
        throw new Error('Falha no login - verifique credenciais');
      }

      this.logger.log('✅ Login realizado com sucesso!');

      // PASSO 2: PESQUISAR VAGAS
      this.logger.log(`🔍 Pesquisando vagas: "${config.tipoVaga}"`);
      await page.goto(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(config.tipoVaga)}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await this.delay(3000);

      // Coletar vagas
      await this.scrollLentamente(page);
      await this.delay(2000);

      const jobLinks = await this.coletarVagas(page, config.maxAplicacoes * 3);
      this.logger.log(`🎯 ${jobLinks.length} vagas encontradas inicialmente`);

      // FILTRAR VAGAS JÁ APLICADAS
      const vagasFiltradas = await this.filtrarVagasJaAplicadas(page, jobLinks, config.maxAplicacoes);
      this.logger.log(`🎯 ${vagasFiltradas.length} vagas disponíveis após filtro`);

      if (vagasFiltradas.length === 0) {
        return {
          success: true,
          results: [],
          message: '⚠️ Nenhuma vaga nova encontrada. Todas as vagas disponíveis já foram aplicadas anteriormente.'
        };
      }

      // PASSO 3: APLICAR PARA VAGAS
      let aplicacoesRealizadas = 0;
      
      for (let i = 0; i < vagasFiltradas.length && aplicacoesRealizadas < config.maxAplicacoes; i++) {
        const vaga = vagasFiltradas[i];
        
        try {
          // Verifica empresa bloqueada
          if (config.empresasBloqueadas.some(empresa => 
            vaga.company.toLowerCase().includes(empresa.toLowerCase())
          )) {
            this.logger.log(`🚫 Empresa bloqueada: ${vaga.company}`);
            results.push({
              success: false,
              jobTitle: vaga.title,
              company: vaga.company,
              applied: false,
              error: 'Empresa bloqueada',
              timestamp: new Date(),
              jobUrl: vaga.url
            });
            continue;
          }

          this.logger.log(`📝 Processando vaga ${i + 1}/${vagasFiltradas.length}: ${vaga.title} - ${vaga.company}`);
          
          const result = await this.aplicarParaVaga(page, vaga);
          results.push(result);
          
          if (result.applied) {
            aplicacoesRealizadas++;
            this.vagasAplicadas.add(vaga.url);
            await this.salvarVagaAplicada(config.mentoradoId, vaga);
            this.logger.log(`✅ APLICAÇÃO ${aplicacoesRealizadas}/${config.maxAplicacoes} REALIZADA!`);
          } else {
            this.logger.log(`❌ Falha na aplicação: ${result.error}`);
          }
          
          await this.delay(3000 + Math.random() * 2000);
          
        } catch (error: any) {
          this.logger.error(`❌ Erro na vaga ${i + 1}:`, error.message);
          results.push({
            success: false,
            jobTitle: vaga.title,
            company: vaga.company,
            applied: false,
            error: `Erro: ${error.message}`,
            timestamp: new Date(),
            jobUrl: vaga.url
          });
          continue;
        }
      }

      return {
        success: true,
        results,
        message: `✅ Concluído: ${aplicacoesRealizadas}/${config.maxAplicacoes} aplicações realizadas`
      };

    } catch (error: any) {
      this.logger.error('Erro na automação:', error);
      
      return {
        success: false,
        results: [],
        message: `❌ Erro: ${error.message}`
      };
    } finally {
      this.logger.log('💻 Automação finalizada');
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  /**
   * LOGIN UNIVERSAL - FUNCIONA EM TODOS OS AMBIENTES
   */
  private async realizarLoginUniversal(page: Page, email: string, password: string): Promise<boolean> {
    try {
      this.logger.log('🔐 Iniciando processo de login...');

      // Vá para a página de login
      await page.goto('https://www.linkedin.com/login', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await this.delay(2000);

      // Verificar se já está logado
      if (await this.verificarSeEstaLogado(page)) {
        this.logger.log('✅ Já está logado!');
        return true;
      }

      this.logger.log('📧 Preenchendo email...');
      await page.fill('#username', email);
      await this.delay(1000);

      this.logger.log('🔑 Preenchendo senha...');
      await page.fill('#password', password);
      await this.delay(1000);

      this.logger.log('🖱️ Clicando no botão de login...');
      await page.click('button[type="submit"]');
      await this.delay(5000);

      // Verificar se login foi bem sucedido
      const loginSucesso = await this.verificarSeEstaLogado(page);
      
      if (loginSucesso) {
        this.logger.log('✅ Login realizado com sucesso!');
        return true;
      } else {
        this.logger.error('❌ Falha no login - verifique credenciais');
        return false;
      }

    } catch (error: any) {
      this.logger.error(`❌ Erro no login: ${error.message}`);
      return false;
    }
  }

  /**
   * VERIFICAÇÃO DE LOGIN
   */
  private async verificarSeEstaLogado(page: Page): Promise<boolean> {
    try {
      // Verificações básicas de login
      const loggedInIndicators = [
        'nav.global-nav',
        'div[data-test-global-nav-header]',
        'img.global-nav__me-photo',
        'a[data-control-name="identity_profile_photo"]',
        'input[role="combobox"]', // Search bar
        'a[href*="/feed/"]' // Feed link
      ];

      for (const selector of loggedInIndicators) {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          return true;
        }
      }

      // Verificar URL
      const currentUrl = page.url();
      return currentUrl.includes('/feed/') || 
             currentUrl.includes('/mynetwork/') ||
             !currentUrl.includes('/login');

    } catch (error) {
      return false;
    }
  }

  /**
   * BUSCA VAGAS APLICADAS EM EXECUÇÕES ANTERIORES
   */
  private async buscarVagasAplicadasAnteriormente(mentoradoId: string): Promise<VagaAplicada[]> {
    try {
      return await this.vagaAplicadaRepository.find({
        where: { mentoradoId },
        order: { appliedAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error('Erro ao buscar vagas aplicadas anteriormente:', error);
      return [];
    }
  }

  /**
   * SALVA VAGA APLICADA NO BANCO
   */
  private async salvarVagaAplicada(mentoradoId: string, vaga: {url: string, title: string, company: string}): Promise<void> {
    try {
      const vagaAplicada = this.vagaAplicadaRepository.create({
        mentoradoId,
        jobUrl: vaga.url,
        jobTitle: vaga.title,
        company: vaga.company,
        appliedAt: new Date()
      });

      await this.vagaAplicadaRepository.save(vagaAplicada);
      this.logger.log(`💾 Vaga salva no histórico: ${vaga.title}`);
    } catch (error) {
      this.logger.error('Erro ao salvar vaga aplicada:', error);
    }
  }

  /**
   * VERIFICA SE VAGA JÁ FOI APLICADA (BANCO + CACHE)
   */
  private async verificarSeVagaJaFoiAplicada(jobUrl: string): Promise<boolean> {
    if (this.vagasAplicadas.has(jobUrl)) {
      return true;
    }

    try {
      const vagaExistente = await this.vagaAplicadaRepository.findOne({
        where: { jobUrl }
      });
      
      if (vagaExistente) {
        this.vagasAplicadas.add(jobUrl);
        return true;
      }
    } catch (error) {
      this.logger.error('Erro ao verificar vaga no banco:', error);
    }

    return false;
  }

  /**
   * FILTRAR VAGAS JÁ APLICADAS
   */
  private async filtrarVagasJaAplicadas(page: Page, jobLinks: any[], maxAplicacoes: number): Promise<any[]> {
    const vagasFiltradas: any[] = [];
    
    this.logger.log('🔍 Verificando vagas já aplicadas...');
    
    for (let i = 0; i < jobLinks.length && vagasFiltradas.length < maxAplicacoes; i++) {
      const vaga = jobLinks[i];
      
      try {
        const jaAplicada = await this.verificarSeVagaJaFoiAplicada(vaga.url);
        if (jaAplicada) {
          this.logger.log(`⏭️ Vaga já aplicada (histórico): ${vaga.title}`);
          continue;
        }

        await page.goto(vaga.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });
        await this.delay(1500);

        const jaAplicadoLinkedIn = await this.verificarSeJaAplicouNoLinkedIn(page);
        
        if (jaAplicadoLinkedIn) {
          this.logger.log(`⏭️ Vaga já aplicada no LinkedIn: ${vaga.title}`);
          this.vagasAplicadas.add(vaga.url);
          await this.salvarVagaAplicada('sistema', vaga);
          continue;
        }

        vagasFiltradas.push(vaga);
        this.logger.log(`✅ Vaga disponível: ${vaga.title}`);

      } catch (error) {
        this.logger.log(`⚠️ Erro ao verificar vaga ${vaga.title}: ${error.message}`);
        vagasFiltradas.push(vaga);
      }
    }

    return vagasFiltradas;
  }

  /**
   * VERIFICA SE JÁ APLICOU NA VAGA NO LINKEDIN
   */
  private async verificarSeJaAplicouNoLinkedIn(page: Page): Promise<boolean> {
    try {
      const selectorsAplicado = [
        '.artdeco-inline-feedback--success',
        '[aria-label*="applied"]',
        '[aria-label*="aplicado"]',
        '.jobs-apply-button--applied',
        'button[aria-label*="Applied"]',
        'button[aria-label*="Aplicado"]',
        'span:has-text("Applied")',
        'span:has-text("Aplicado")'
      ];

      for (const selector of selectorsAplicado) {
        const elemento = await page.$(selector);
        if (elemento && await elemento.isVisible()) {
          return true;
        }
      }

      const botaoApply = await page.$('button[aria-label*="Easy Apply"], button[aria-label*="Candidatura simplificada"], .jobs-apply-button');
      if (botaoApply) {
        const isDisabled = await botaoApply.getAttribute('disabled');
        const ariaLabel = (await botaoApply.getAttribute('aria-label') || '').toLowerCase();
        const texto = (await botaoApply.textContent() || '').toLowerCase();
        
        if (isDisabled !== null || 
            ariaLabel.includes('applied') || 
            ariaLabel.includes('aplicado') ||
            texto.includes('applied') ||
            texto.includes('aplicado')) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.log('Erro ao verificar se já aplicou no LinkedIn');
      return false;
    }
  }

  /**
   * CLICA NO BOTÃO EASY APPLY
   */
  private async clicarBotaoCandidaturaFacil(page: Page): Promise<boolean> {
    try {
      this.logger.log('🔍 Procurando botão de candidatura fácil...');

      const selectors = [
        'button[aria-label*="Candidatura simplificada"]',
        'button[aria-label*="Easy Apply"]',
        'button[data-easy-apply="true"]',
        '.jobs-apply-button',
        '.jobs-apply-button--top-card',
        'button:has-text("Easy Apply")',
        'button:has-text("Candidatura simplificada")'
      ];

      for (const selector of selectors) {
        try {
          const button = await page.$(selector);
          if (button && await button.isVisible() && await button.isEnabled()) {
            await button.scrollIntoViewIfNeeded();
            await this.delay(500);
            
            this.logger.log(`🖱️ Clicando no botão: ${selector}`);
            await button.click();
            await this.delay(2000);
            
            const modalAberto = await page.$('.jobs-easy-apply-modal, [data-test-modal], .artdeco-modal');
            if (modalAberto) {
              this.logger.log('✅ Modal de candidatura aberto!');
              return true;
            }
          }
        } catch (error) {
          continue;
        }
      }

      this.logger.log('❌ Nenhum botão de candidatura fácil encontrado');
      return false;

    } catch (error) {
      this.logger.error('Erro ao tentar clicar no botão:', error);
      return false;
    }
  }

  /**
   * APLICA PARA VAGA
   */
  private async aplicarParaVaga(
    page: Page, 
    vaga: {url: string, title: string, company: string}
  ): Promise<CandidaturaResult> {
    
    const result: CandidaturaResult = {
      success: false,
      jobTitle: vaga.title,
      company: vaga.company,
      applied: false,
      timestamp: new Date(),
      jobUrl: vaga.url
    };

    try {
      this.logger.log(`🌐 Acessando vaga: ${vaga.title}`);
      await page.goto(vaga.url, { 
        waitUntil: 'domcontentloaded'
      });
      await this.delay(2000);

      const jaAplicada = await this.verificarSeVagaJaFoiAplicada(vaga.url);
      if (jaAplicada) {
        result.error = 'Já aplicado anteriormente (histórico)';
        return result;
      }

      const jaAplicadoLinkedIn = await this.verificarSeJaAplicouNoLinkedIn(page);
      if (jaAplicadoLinkedIn) {
        result.error = 'Já aplicado no LinkedIn';
        await this.salvarVagaAplicada('sistema', vaga);
        return result;
      }

      const botaoClicado = await this.clicarBotaoCandidaturaFacil(page);
      
      if (!botaoClicado) {
        result.error = 'Não é candidatura fácil ou botão não encontrado';
        return result;
      }

      result.applied = await this.processarCandidaturaSimplificada(page);

      if (result.applied) {
        result.success = true;
        this.logger.log(`✅ CANDIDATURA REALIZADA: ${vaga.title}`);
      }

    } catch (error: any) {
      result.error = `Erro: ${error.message}`;
      this.logger.error(`Erro na vaga ${vaga.title}:`, error.message);
    }

    return result;
  }

  /**
   * PROCESSADOR SIMPLIFICADO - APENAS CLICA EM NEXT
   */
  private async processarCandidaturaSimplificada(page: Page): Promise<boolean> {
    try {
      let tentativas = 0;
      const maxTentativas = 6;

      while (tentativas < maxTentativas) {
        await this.delay(1500);

        // Primeiro tenta encontrar e clicar em SUBMIT
        const submitSelectors = [
          '[aria-label="Submit application"]',
          '[aria-label="Enviar candidatura"]',
          'button:has-text("Submit application")',
          'button:has-text("Enviar candidatura")',
          'button[aria-label*="Submit"]',
          'button[aria-label*="Enviar"]'
        ];

        for (const selector of submitSelectors) {
          const botaoSubmit = await page.$(selector);
          if (botaoSubmit && await botaoSubmit.isEnabled()) {
            this.logger.log(`🎯 Clicando em SUBMIT: ${selector}`);
            
            await botaoSubmit.click();
            await this.delay(2000);
            
            const successIndicator = await page.$('.artdeco-inline-feedback--success, [aria-label*="applied"], [aria-label*="aplicado"]');
            if (successIndicator) {
              this.logger.log('✅ CANDIDATURA ENVIADA COM SUCESSO!');
              return true;
            }
            
            // Verificar se modal fechou (indica sucesso)
            const modalFechou = !(await page.$('.jobs-easy-apply-modal, [data-test-modal]'));
            if (modalFechou) {
              this.logger.log('✅ Candidatura enviada (modal fechado)');
              return true;
            }
            
            return true;
          }
        }

        // Se não encontrou submit, tenta NEXT
        const nextSelectors = [
          '[aria-label="Continue to next step"]',
          '[aria-label="Next"]',
          '[aria-label="Avançar"]',
          'button:has-text("Next")',
          'button:has-text("Continue")',
          'button:has-text("Avançar")',
          'button.artdeco-button--primary:not([disabled])'
        ];

        let nextClicado = false;
        for (const selector of nextSelectors) {
          const botaoNext = await page.$(selector);
          if (botaoNext && await botaoNext.isEnabled()) {
            this.logger.log(`⏭️ Clicando em NEXT: ${selector}`);
            
            await botaoNext.click();
            await this.delay(1500);
            nextClicado = true;
            tentativas++;
            break;
          }
        }

        if (!nextClicado) {
          // Verifica se há campos para preencher
          const camposParaPreencher = await this.verificarCamposParaPreencher(page);
          if (camposParaPreencher) {
            this.logger.log('⚠️ Campos que precisam de respostas - Cancelando');
            await this.descartarCandidatura(page);
            return false;
          }

          // Verifica se já terminou
          const closeButton = await page.$('[aria-label="Dismiss"], .artdeco-modal__dismiss');
          if (closeButton) {
            this.logger.log('✅ Candidatura concluída');
            return true;
          }
          
          this.logger.log('⚠️ Nenhum botão encontrado nesta etapa');
          break;
        }
      }

      if (tentativas >= maxTentativas) {
        this.logger.log('❌ Limite de tentativas atingido');
        await this.descartarCandidatura(page);
      }

      return false;

    } catch (error) {
      this.logger.error('Erro no processamento:', error);
      await this.descartarCandidatura(page).catch(() => {});
      return false;
    }
  }

  /**
   * VERIFICA SE EXISTEM CAMPOS QUE PRECISAM DE RESPOSTAS ESCRITAS
   */
  private async verificarCamposParaPreencher(page: Page): Promise<boolean> {
    try {
      const camposTexto = await page.$$('input[type="text"], textarea');
      
      for (const campo of camposTexto) {
        try {
          const isVisible = await campo.isVisible();
          const isEnabled = await campo.isEnabled();
          const valorAtual = await campo.inputValue();
          
          if (isVisible && isEnabled && !valorAtual) {
            this.logger.log('📝 Campo encontrado que precisa de resposta');
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * DESCARTAR CANDIDATURA
   */
  private async descartarCandidatura(page: Page): Promise<boolean> {
    try {
      this.logger.log('🗑️  Descartando candidatura...');

      const descartarSelectors = [
        '[aria-label="Discard"]',
        '[aria-label="Descartar"]',
        'button:has-text("Discard")',
        'button:has-text("Descartar")',
        '.artdeco-modal__dismiss',
        'button[data-test-modal-close-btn]'
      ];

      for (const selector of descartarSelectors) {
        const botaoDescartar = await page.$(selector);
        if (botaoDescartar && await botaoDescartar.isVisible()) {
          this.logger.log(`🗑️  Clicando em descartar: ${selector}`);
          
          await botaoDescartar.click();
          await this.delay(1500);
          
          // Confirmar descarte se necessário
          const confirmarSelectors = [
            '[data-test-dialog-primary-btn]',
            'button:has-text("Confirm")',
            'button:has-text("Confirmar")',
            'button:has-text("Yes")',
            'button:has-text("Sim")'
          ];

          for (const confirmSelector of confirmarSelectors) {
            const botaoConfirmar = await page.$(confirmSelector);
            if (botaoConfirmar && await botaoConfirmar.isVisible()) {
              await botaoConfirmar.click();
              await this.delay(1500);
              break;
            }
          }

          this.logger.log('✅ Candidatura descartada');
          return true;
        }
      }

      // Fallback: pressionar Escape
      await page.keyboard.press('Escape');
      await this.delay(1500);

      return true;

    } catch (error) {
      this.logger.error('Erro ao descartar candidatura:', error);
      return false;
    }
  }

  /**
   * MÉTODOS AUXILIARES
   */
  private async coletarVagas(page: Page, maxAplicacoes: number): Promise<any[]> {
    try {
      return await page.$$eval(
        '.job-card-container, .jobs-search-results__list-item', 
        (cards, max) => 
          cards.slice(0, max).map(card => {
            const link = card.querySelector('a[href*="/jobs/view/"]') as HTMLAnchorElement;
            const company = card.querySelector('.job-card-company-name, .artdeco-entity-lockup__subtitle') as HTMLElement;
            const title = card.querySelector('.job-card-list__title, .artdeco-entity-lockup__title') as HTMLElement;
            
            return {
              url: link?.href || '',
              title: title?.textContent?.trim() || 'Vaga LinkedIn',
              company: company?.textContent?.trim() || 'Empresa',
            };
          }).filter(vaga => vaga.url),
        maxAplicacoes
      );
    } catch (error) {
      this.logger.error('Erro ao coletar vagas:', error);
      return [];
    }
  }

  private async scrollLentamente(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let total = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 300);
          total += 300;
          if (total >= 1500) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}
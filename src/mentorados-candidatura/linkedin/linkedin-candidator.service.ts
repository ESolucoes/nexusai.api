import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
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
  private readonly vagasAplicadas = new Set<string>(); // Cache em memória para a sessão

  constructor(
    private readonly mentoradosService: MentoradosService,
    @InjectRepository(VagaAplicada)
    private readonly vagaAplicadaRepository: Repository<VagaAplicada>,
  ) {}

  /**
   * AUTOMAÇÃO SIMPLIFICADA - APENAS CLICA EM NEXT NO MODAL
   */
  async iniciarAutomacaoCompleta(config: AutomacaoConfig): Promise<{ success: boolean; results: CandidaturaResult[]; message: string }> {
    
    if (!config.mentoradoId || config.mentoradoId.trim() === '') {
      throw new BadRequestException('ID do mentorado é obrigatório e não pode estar vazio');
    }

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    const results: CandidaturaResult[] = [];

    try {
      this.logger.log('🚀 INICIANDO AUTOMAÇÃO SIMPLIFICADA...');
      this.logger.log(`📋 Mentorado ID: ${config.mentoradoId}`);

      // Limpa cache de vagas aplicadas para nova execução
      this.vagasAplicadas.clear();

      // BUSCA VAGAS JÁ APLICADAS EM EXECUÇÕES ANTERIORES
      const vagasAplicadasAnteriormente = await this.buscarVagasAplicadasAnteriormente(config.mentoradoId);
      this.logger.log(`📊 ${vagasAplicadasAnteriormente.length} vagas aplicadas em execuções anteriores`);

      // Adiciona as vagas do banco ao cache da sessão
      vagasAplicadasAnteriormente.forEach(vaga => {
        this.vagasAplicadas.add(vaga.jobUrl);
      });

      // BUSCA INFORMAÇÕES DO MENTORADO
      let mentorado;
      try {
        mentorado = await this.mentoradosService.buscarPorId(config.mentoradoId);
        this.logger.log(`✅ Mentorado encontrado: ${mentorado.cargoObjetivo}`);
      } catch (error) {
        this.logger.error(`❌ Erro ao buscar mentorado: ${error.message}`);
        throw new NotFoundException(`Mentorado com ID ${config.mentoradoId} não encontrado`);
      }

      if (!mentorado) {
        throw new NotFoundException(`Mentorado com ID ${config.mentoradoId} não encontrado`);
      }

      // CONFIGURAÇÃO DO BROWSER
      browser = await chromium.launch({
        headless: false,
        slowMo: 100,
        args: [
          '--no-sandbox', 
          '--disable-dev-shm-usage', 
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });

      context = await browser.newContext({
        viewport: null,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      const page = await context.newPage();
      
      // Configura timeouts
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);

      // PASSO 1: LOGIN
      this.logger.log('🔐 Fazendo login...');
      await page.goto('https://www.linkedin.com/login', { 
        waitUntil: 'domcontentloaded'
      });
      await this.delay(3000);

      // Preenche credenciais
      await page.fill('#username', config.email);
      await this.delay(1000);
      await page.fill('#password', config.password);
      await this.delay(1000);

      // Login
      await page.click('button[type="submit"]');
      await this.delay(5000);

      // Verifica se login foi bem sucedido
      if (page.url().includes('checkpoint') || page.url().includes('login')) {
        throw new Error('Login falhou - verifique credenciais');
      }

      // PASSO 2: PESQUISAR VAGAS
      this.logger.log(`🔍 Pesquisando: ${config.tipoVaga}`);
      await page.goto('https://www.linkedin.com/jobs/', { 
        waitUntil: 'domcontentloaded'
      });
      await this.delay(4000);

      // Pesquisa
      await this.realizarPesquisa(page, config.tipoVaga);
      await this.delay(5000);

      // Coletar vagas
      await this.scrollLentamente(page);
      await this.delay(3000);

      const jobLinks = await this.coletarVagas(page, config.maxAplicacoes * 3); // Coleta mais vagas para compensar as já aplicadas
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

          this.logger.log(`📝 Vaga ${i + 1}/${vagasFiltradas.length}: ${vaga.title} - ${vaga.company}`);
          
          const result = await this.aplicarParaVaga(page, vaga);
          results.push(result);
          
          if (result.applied) {
            aplicacoesRealizadas++;
            // Adiciona ao cache de vagas aplicadas E salva no banco
            this.vagasAplicadas.add(vaga.url);
            await this.salvarVagaAplicada(config.mentoradoId, vaga);
            this.logger.log(`✅ APLICAÇÃO ${aplicacoesRealizadas}/${config.maxAplicacoes} REALIZADA!`);
          } else {
            this.logger.log(`❌ Falha na aplicação: ${result.error}`);
          }
          
          // Delay entre aplicações
          await this.delay(5000 + Math.random() * 3000);
          
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
      // Fecha o browser
      if (browser) {
        await browser.close().catch(() => {});
      }
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
    // Verifica primeiro no cache da sessão (mais rápido)
    if (this.vagasAplicadas.has(jobUrl)) {
      return true;
    }

    // Verifica no banco de dados
    try {
      const vagaExistente = await this.vagaAplicadaRepository.findOne({
        where: { jobUrl }
      });
      
      if (vagaExistente) {
        // Adiciona ao cache para próximas verificações
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
        // Verifica se já aplicou em execuções anteriores (banco) ou nesta sessão (cache)
        const jaAplicada = await this.verificarSeVagaJaFoiAplicada(vaga.url);
        if (jaAplicada) {
          this.logger.log(`⏭️ Vaga já aplicada (histórico): ${vaga.title}`);
          continue;
        }

        // Abre a vaga para verificar status no LinkedIn
        await page.goto(vaga.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });
        await this.delay(2000);

        // Verifica se já aplicou (múltiplos indicadores no LinkedIn)
        const jaAplicadoLinkedIn = await this.verificarSeJaAplicouNoLinkedIn(page);
        
        if (jaAplicadoLinkedIn) {
          this.logger.log(`⏭️ Vaga já aplicada no LinkedIn: ${vaga.title}`);
          // Adiciona ao cache e salva no banco
          this.vagasAplicadas.add(vaga.url);
          await this.salvarVagaAplicada('sistema', vaga); // Salva como detectada pelo sistema
          continue;
        }

        // Se passou por todas as verificações, adiciona à lista
        vagasFiltradas.push(vaga);
        this.logger.log(`✅ Vaga disponível: ${vaga.title}`);

      } catch (error) {
        this.logger.log(`⚠️ Erro ao verificar vaga ${vaga.title}: ${error.message}`);
        // Em caso de erro, considera como disponível para tentar aplicar
        vagasFiltradas.push(vaga);
      }
    }

    return vagasFiltradas;
  }

  /**
   * VERIFICA SE JÁ APLICOU NA VAGA NO LINKEDIN (MÚLTIPLOS MÉTODOS)
   */
  private async verificarSeJaAplicouNoLinkedIn(page: Page): Promise<boolean> {
    try {
      // Método 1: Verifica indicador visual de aplicação
      const selectorsAplicado = [
        '.artdeco-inline-feedback--success',
        '[aria-label*="applied"]',
        '[aria-label*="aplicado"]',
        '.jobs-apply-button--applied',
        'button[aria-label*="Applied"]',
        'button[aria-label*="Aplicado"]',
        '.artdeco-inline-feedback__message',
        'span:has-text("Applied")',
        'span:has-text("Aplicado")',
        'span:has-text("Candidatura enviada")'
      ];

      for (const selector of selectorsAplicado) {
        const elemento = await page.$(selector);
        if (elemento && await elemento.isVisible()) {
          const texto = await elemento.textContent();
          if (texto && (texto.includes('Applied') || texto.includes('Aplicado') || texto.includes('enviada'))) {
            return true;
          }
        }
      }

      // Método 2: Verifica se o botão de aplicação está desativado ou mudou
      const botaoApply = await page.$('button[aria-label*="Easy Apply"], button[aria-label*="Candidatura simplificada"], .jobs-apply-button');
      if (botaoApply) {
        const isDisabled = await botaoApply.getAttribute('disabled');
        const ariaLabel = await botaoApply.getAttribute('aria-label') || '';
        const texto = await botaoApply.textContent() || '';
        
        if (isDisabled !== null || 
            ariaLabel.includes('Applied') || 
            ariaLabel.includes('Aplicado') ||
            texto.includes('Applied') ||
            texto.includes('Aplicado')) {
          return true;
        }
      }

      // Método 3: Verifica texto na página indicando aplicação
      const pageText = await page.textContent('body') || '';
      if (pageText.includes('You have applied') || 
          pageText.includes('Você se candidatou') ||
          pageText.includes('Candidatura enviada')) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.log('Erro ao verificar se já aplicou no LinkedIn, considerando como não aplicado');
      return false;
    }
  }

  /**
   * MÉTODO SIMPLIFICADO PARA CLICAR NO BOTÃO EASY APPLY
   */
  private async clicarBotaoCandidaturaFacil(page: Page): Promise<boolean> {
    try {
      this.logger.log('🔍 Procurando botão de candidatura fácil...');

      const selectors = [
        'button[aria-label*="Candidatura simplificada"]',
        'button[aria-label*="Easy Apply"]',
        'button[data-easy-apply="true"]',
        '.jobs-apply-button',
        '.jobs-apply-button--top-card'
      ];

      for (const selector of selectors) {
        try {
          const button = await page.waitForSelector(selector, { 
            timeout: 3000
          }).catch(() => null);

          if (button) {
            const isVisible = await button.isVisible();
            const isEnabled = await button.isEnabled();
            
            if (isVisible && isEnabled) {
              await button.scrollIntoViewIfNeeded();
              await this.delay(1000);
              
              await button.click();
              await this.delay(3000);
              
              // Verifica se o modal abriu
              const modalAberto = await page.$('.jobs-easy-apply-modal, [data-test-modal]');
              if (modalAberto) {
                this.logger.log('✅ Modal de candidatura aberto!');
                return true;
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Fallback por texto
      const textosBotao = [
        'Candidatura simplificada',
        'Easy Apply', 
        'Candidatar-se'
      ];

      for (const texto of textosBotao) {
        try {
          const buttonByText = await page.$(`button:has-text("${texto}")`);
          if (buttonByText && await buttonByText.isVisible()) {
            await buttonByText.scrollIntoViewIfNeeded();
            await this.delay(1000);
            await buttonByText.click();
            await this.delay(3000);
            
            const modalAberto = await page.$('.jobs-easy-apply-modal');
            if (modalAberto) return true;
          }
        } catch (error) {
          continue;
        }
      }

      this.logger.log('❌ Nenhum botão de candidatura fácil funcionou');
      return false;

    } catch (error) {
      this.logger.error('Erro ao tentar clicar no botão:', error);
      return false;
    }
  }

  /**
   * APLICA PARA VAGA - VERSÃO SIMPLIFICADA
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
      // Abre vaga
      await page.goto(vaga.url, { 
        waitUntil: 'domcontentloaded'
      });
      await this.delay(3000);

      // Verificação final antes de aplicar
      const jaAplicada = await this.verificarSeVagaJaFoiAplicada(vaga.url);
      if (jaAplicada) {
        result.error = 'Já aplicado anteriormente (histórico)';
        return result;
      }

      const jaAplicadoLinkedIn = await this.verificarSeJaAplicouNoLinkedIn(page);
      if (jaAplicadoLinkedIn) {
        result.error = 'Já aplicado no LinkedIn';
        // Salva no banco pois detectamos que já foi aplicada
        await this.salvarVagaAplicada('sistema', vaga);
        return result;
      }

      // Clica no botão Easy Apply
      const botaoClicado = await this.clicarBotaoCandidaturaFacil(page);
      
      if (!botaoClicado) {
        result.error = 'Não é candidatura fácil ou botão não encontrado';
        return result;
      }

      // PROCESSO SIMPLIFICADO: APENAS CLICA EM NEXT ATÉ FINALIZAR
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
   * PROCESSADOR SIMPLIFICADO - APENAS CLICA EM NEXT (CORRIGIDO)
   */
  private async processarCandidaturaSimplificada(page: Page): Promise<boolean> {
    try {
      let tentativas = 0;
      const maxTentativas = 10;

      while (tentativas < maxTentativas) {
        await this.delay(2000);

        // PRIMEIRO: Tenta encontrar botão SUBMIT final
        const submitSelectors = [
          '[aria-label="Submit application"]',
          '[aria-label="Enviar candidatura"]',
          'button:has-text("Submit application")',
          'button:has-text("Enviar candidatura")'
        ];

        for (const selector of submitSelectors) {
          const botaoSubmit = await page.$(selector);
          if (botaoSubmit && await botaoSubmit.isEnabled()) {
            this.logger.log(`🎯 Clicando em SUBMIT: ${selector}`);
            
            // Tenta clicar de diferentes formas
            const cliqueSucesso = await this.tentarClicarDeVariasFormas(page, botaoSubmit);
            
            if (cliqueSucesso) {
              await this.delay(3000);
              
              // Verifica sucesso
              const successIndicator = await page.$('.artdeco-inline-feedback--success, [aria-label*="submitted"]');
              if (successIndicator) {
                this.logger.log('✅ CANDIDATURA ENVIADA COM SUCESSO!');
                return true;
              }
            }
          }
        }

        // SEGUNDO: Tenta NEXT/CONTINUE
        const nextSelectors = [
          '[aria-label="Continue to next step"]',
          '[aria-label="Next"]',
          '[aria-label="Avançar"]',
          'button:has-text("Next")',
          'button:has-text("Continue")',
          'button:has-text("Avançar")',
          'button.artdeco-button--primary' // Seletores mais genéricos
        ];

        let nextClicado = false;
        for (const selector of nextSelectors) {
          const botaoNext = await page.$(selector);
          if (botaoNext && await botaoNext.isEnabled()) {
            this.logger.log(`⏭️ Tentando clicar em NEXT: ${selector}`);
            
            // Tenta clicar de diferentes formas
            const cliqueSucesso = await this.tentarClicarDeVariasFormas(page, botaoNext);
            
            if (cliqueSucesso) {
              this.logger.log(`✅ Clique em NEXT bem-sucedido: ${selector}`);
              await this.delay(2000);
              nextClicado = true;
              tentativas++;
              break;
            } else {
              this.logger.log(`❌ Falha ao clicar em: ${selector}`);
            }
          }
        }

        if (!nextClicado) {
          // TERCEIRO: Verifica se tem campos que precisam de respostas escritas
          const camposParaPreencher = await this.verificarCamposParaPreencher(page);
          if (camposParaPreencher) {
            this.logger.log('⚠️ Encontrou campos que precisam de respostas escritas - Cancelando aplicação');
            await this.descartarCandidatura(page);
            return false; // Não conta como aplicação realizada
          }

          // QUARTO: Tenta encontrar botão de fechar (caso tenha concluído)
          const closeButton = await page.$('[aria-label="Dismiss"], .artdeco-modal__dismiss');
          if (closeButton) {
            this.logger.log('✅ Candidatura concluída (botão fechar encontrado)');
            return true;
          }
          
          // QUINTO: Se não encontrou nenhum botão, verifica se ainda há formulário
          const formAtual = await page.$('input, textarea, select');
          if (!formAtual) {
            this.logger.log('✅ Nenhum campo encontrado - candidatura concluída');
            return true;
          }
          
          this.logger.log('⚠️ Nenhum botão NEXT/SUBMIT encontrado nesta etapa');
          break;
        }
      }

      // Só descarta se atingiu o limite de tentativas
      if (tentativas >= maxTentativas) {
        this.logger.log('❌ Limite de tentativas atingido - Cancelando aplicação');
        await this.descartarCandidatura(page);
      }

      return false;

    } catch (error) {
      this.logger.error('Erro no processamento - Cancelando aplicação:', error);
      await this.descartarCandidatura(page).catch(() => {}); // Tenta descartar mesmo com erro
      return false;
    }
  }

  /**
   * VERIFICA SE EXISTEM CAMPOS QUE PRECISAM DE RESPOSTAS ESCRITAS
   */
  private async verificarCamposParaPreencher(page: Page): Promise<boolean> {
    try {
      // Procura por campos de texto vazios que precisam ser preenchidos
      const camposTexto = await page.$$('input[type="text"], textarea');
      
      for (const campo of camposTexto) {
        try {
          const isVisible = await campo.isVisible();
          const isEnabled = await campo.isEnabled();
          const valorAtual = await campo.inputValue();
          const placeholder = await campo.getAttribute('placeholder') || '';
          const ariaLabel = await campo.getAttribute('aria-label') || '';
          
          // Se é um campo visível, habilitado e vazio, precisa de resposta
          if (isVisible && isEnabled && !valorAtual) {
            const textoCampo = (placeholder + ' ' + ariaLabel).toLowerCase();
            
            // Ignora campos de busca ou que não são perguntas
            if (!textoCampo.includes('search') && !textoCampo.includes('buscar')) {
              this.logger.log(`📝 Campo encontrado que precisa de resposta: ${textoCampo.substring(0, 50)}`);
              return true;
            }
          }
        } catch (error) {
          continue;
        }
      }

      return false;
    } catch (error) {
      this.logger.log('Erro ao verificar campos para preencher');
      return false;
    }
  }

  /**
   * DESCARTAR CANDIDATURA - CLICA NO BOTÃO DE DESCARTE
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
        '[data-test-modal-close-btn]'
      ];

      for (const selector of descartarSelectors) {
        const botaoDescartar = await page.$(selector);
        if (botaoDescartar && await botaoDescartar.isVisible()) {
          this.logger.log(`🗑️  Clicando em descartar: ${selector}`);
          
          // Tenta clicar de diferentes formas
          const cliqueSucesso = await this.tentarClicarDeVariasFormas(page, botaoDescartar);
          
          if (cliqueSucesso) {
            await this.delay(2000);
            
            // Confirma descarte se houver popup de confirmação
            const confirmarSelectors = [
              '[data-test-dialog-primary-btn]',
              'button:has-text("Confirm")',
              'button:has-text("Confirmar")',
              '.artdeco-button--primary'
            ];

            for (const confirmSelector of confirmarSelectors) {
              const botaoConfirmar = await page.$(confirmSelector);
              if (botaoConfirmar && await botaoConfirmar.isVisible()) {
                await botaoConfirmar.click();
                await this.delay(2000);
                break;
              }
            }

            this.logger.log('✅ Candidatura descartada com sucesso');
            return true;
          }
        }
      }

      // Se não encontrou botão de descartar, tenta fechar o modal de outras formas
      this.logger.log('⚠️ Botão de descartar não encontrado, tentando fechar modal...');
      
      // Tenta ESC para fechar
      await page.keyboard.press('Escape');
      await this.delay(2000);

      // Tenta clicar fora do modal
      await page.mouse.click(10, 10);
      await this.delay(2000);

      this.logger.log('✅ Modal fechado');
      return true;

    } catch (error) {
      this.logger.error('Erro ao descartar candidatura:', error);
      return false;
    }
  }

  /**
   * TENTA CLICAR DE VÁRIAS FORMAS PARA EVITAR INTERCEPTAÇÃO
   */
  private async tentarClicarDeVariasFormas(page: Page, element: any): Promise<boolean> {
    const metodosClique = [
      // Método 1: Clique normal
      async () => {
        await element.click({ timeout: 5000 });
        return true;
      },
      
      // Método 2: Clique via JavaScript (evita interceptação)
      async () => {
        await page.evaluate((el: HTMLElement) => {
          el.click();
        }, element);
        return true;
      },
      
      // Método 3: Clique via dispatchEvent
      async () => {
        await element.dispatchEvent('click');
        return true;
      },
      
      // Método 4: Clique via coordenadas (ignora elementos sobrepostos)
      async () => {
        const box = await element.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          return true;
        }
        return false;
      },
      
      // Método 5: Clique via Enter
      async () => {
        await element.focus();
        await page.keyboard.press('Enter');
        return true;
      },
      
      // Método 6: Clique via Space
      async () => {
        await element.focus();
        await page.keyboard.press('Space');
        return true;
      },
      
      // Método 7: Force click via JavaScript
      async () => {
        await page.evaluate((el: HTMLElement) => {
          const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          el.dispatchEvent(event);
        }, element);
        return true;
      }
    ];

    for (const metodo of metodosClique) {
      try {
        await metodo();
        this.logger.log('✅ Clique realizado com sucesso');
        return true;
      } catch (error) {
        this.logger.log(`⚠️ Método de clique falhou, tentando próximo...`);
        await this.delay(500);
        continue;
      }
    }
    
    return false;
  }

  /**
   * MÉTODOS AUXILIARES
   */
  private async realizarPesquisa(page: Page, tipoVaga: string): Promise<void> {
    const searchSelectors = [
      'input[aria-label*="Pesquisar cargo"]',
      'input[aria-label*="Search jobs"]',
      'input.search-box__input'
    ];

    for (const selector of searchSelectors) {
      const searchInput = await page.$(selector);
      if (searchInput) {
        await searchInput.click();
        await this.delay(1000);
        await page.keyboard.type(tipoVaga);
        await this.delay(1000);
        await page.keyboard.press('Enter');
        this.logger.log('✅ Pesquisa realizada');
        return;
      }
    }

    this.logger.log('⚠️ Campo de pesquisa não encontrado, continuando...');
  }

  private async coletarVagas(page: Page, maxAplicacoes: number): Promise<any[]> {
    return await page.$$eval(
      '.job-card-container, .job-card-list', 
      (cards: HTMLElement[], max: number) => 
        cards.slice(0, max).map(card => {
          const link = card.querySelector('a[href*="/jobs/view/"]') as HTMLAnchorElement;
          const company = card.querySelector('.job-card-company-name, [class*="company-name"]') as HTMLElement;
          const title = card.querySelector('.job-card-list__title, [class*="job-title"]') as HTMLElement;
          
          return {
            url: link?.href || '',
            title: title?.textContent?.trim() || 'Vaga LinkedIn',
            company: company?.textContent?.trim() || 'Empresa',
          };
        }).filter(vaga => vaga.url),
      maxAplicacoes
    );
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

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * MÉTODO MANTIDO PARA COMPATIBILIDADE (mas não usado)
   */
  private prepararRespostasAutomaticas(mentorado: any, respostasConfig: RespostasChatConfig) {
    // Método mantido para compatibilidade mas não utilizado
    return {};
  }
}
// src/config/cleanup-chrome.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function cleanupChromeProcesses(): Promise<void> {
  console.log('🧹 Limpando processos do Chrome e Playwright...');
  
  try {
    if (process.platform === 'win32') {
      // Windows
      await execAsync('taskkill /f /im chrome.exe /t');
      await execAsync('taskkill /f /im chromedriver.exe /t');
      await execAsync('taskkill /f /im chromium.exe /t');
      console.log('✅ Processos do Chrome finalizados no Windows');
    } else {
      // Linux/Mac - Mais abrangente
      await execAsync('pkill -f "chrome" || true');
      await execAsync('pkill -f "chromium" || true');
      await execAsync('pkill -f "chromedriver" || true');
      await execAsync('pkill -f "headless-chrome" || true');
      await execAsync('pkill -f "playwright" || true');
      console.log('✅ Processos do Chrome finalizados no Linux/Mac');
    }
  } catch (error) {
    console.log('ℹ️ Nenhum processo do Chrome encontrado ou erro na limpeza:', error);
  }
}

// Para usar manualmente se necessário
if (require.main === module) {
  cleanupChromeProcesses();
}
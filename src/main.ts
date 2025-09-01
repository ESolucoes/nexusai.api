import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: [
      'https://processosniper.com.br',
      'https://www.processosniper.com.br',
      'https://api.processosniper.com.br',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    exposedHeaders: ['Authorization'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('NexusAI - API')
    .setDescription('Documentação da API do NexusAI (Auth, Usuários, Mentores, Mentorados, Agentes)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: (a: any, b: any) => {
        const order = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']
        const mA = a.get('method')
        const mB = b.get('method')
        if (mA !== mB) return order.indexOf(mA) - order.indexOf(mB)
        const pA = a.get('path')
        const pB = b.get('path')
        return pA.localeCompare(pB)
      },
    },
  })

  // sem fallback manual de sendFile — nada de caminhos relativos aqui
  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0')
}
bootstrap()

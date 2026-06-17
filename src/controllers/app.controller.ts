import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppService } from '../services/app.service'

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Verifica se a aplicação está no ar',
  })
  @ApiOkResponse({ description: 'Aplicação rodando', type: String })
  getHello(): string {
    return this.appService.getHello()
  }
}

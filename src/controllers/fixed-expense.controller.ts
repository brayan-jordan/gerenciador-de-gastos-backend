import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common'
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CreateFixedExpenseContract } from '../contracts/create-fixed-expense.contract'
import { UpdateFixedExpenseContract } from '../contracts/update-fixed-expense.contract'
import type { AuthenticatedUser } from '../decorators/current-user.decorator'
import { CurrentUser } from '../decorators/current-user.decorator'
import { FixedExpensePresenter } from '../presenters/fixed-expense.presenter'
import { FixedExpenseService } from '../services/fixed-expense.service'

@ApiTags('Fixed Expenses')
@ApiCookieAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Não autenticado' })
@Controller('fixed-expenses')
export class FixedExpenseController {
  constructor(private readonly fixedExpenseService: FixedExpenseService) {}

  @Post()
  @ApiOperation({ summary: 'Criar gasto fixo', description: 'Cria um novo gasto fixo para o usuário autenticado' })
  @ApiCreatedResponse({ description: 'Gasto fixo criado', type: FixedExpensePresenter })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createFixedExpenseContract: CreateFixedExpenseContract,
  ): Promise<FixedExpensePresenter> {
    const fixedExpense = await this.fixedExpenseService.create(user.sub, createFixedExpenseContract)
    return FixedExpensePresenter.toHttp(fixedExpense)
  }

  @Get()
  @ApiOperation({ summary: 'Listar gastos fixos', description: 'Lista todos os gastos fixos ativos do usuário autenticado' })
  @ApiOkResponse({ description: 'Lista de gastos fixos', type: [FixedExpensePresenter] })
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<FixedExpensePresenter[]> {
    const fixedExpenses = await this.fixedExpenseService.findAll(user.sub)
    return fixedExpenses.map(FixedExpensePresenter.toHttp)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar gasto fixo', description: 'Busca um gasto fixo pelo id' })
  @ApiOkResponse({ description: 'Gasto fixo encontrado', type: FixedExpensePresenter })
  @ApiNotFoundResponse({ description: 'Gasto fixo não encontrado' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FixedExpensePresenter> {
    const fixedExpense = await this.fixedExpenseService.findOne(user.sub, id)
    return FixedExpensePresenter.toHttp(fixedExpense)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar gasto fixo', description: 'Atualiza parcialmente um gasto fixo pelo id' })
  @ApiOkResponse({ description: 'Gasto fixo atualizado', type: FixedExpensePresenter })
  @ApiNotFoundResponse({ description: 'Gasto fixo não encontrado' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFixedExpenseContract: UpdateFixedExpenseContract,
  ): Promise<FixedExpensePresenter> {
    const fixedExpense = await this.fixedExpenseService.update(user.sub, id, updateFixedExpenseContract)
    return FixedExpensePresenter.toHttp(fixedExpense)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover gasto fixo', description: 'Remove (soft delete) um gasto fixo pelo id' })
  @ApiNoContentResponse({ description: 'Gasto fixo removido' })
  @ApiNotFoundResponse({ description: 'Gasto fixo não encontrado' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.fixedExpenseService.remove(user.sub, id)
  }
}

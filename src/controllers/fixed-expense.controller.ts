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
  Query,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ConfirmFixedExpenseContract } from '../contracts/confirm-fixed-expense.contract'
import { CreateFixedExpenseContract } from '../contracts/create-fixed-expense.contract'
import { PendingFixedExpenseQuery } from '../contracts/pending-fixed-expense.contract'
import { UpdateFixedExpenseContract } from '../contracts/update-fixed-expense.contract'
import type { AuthenticatedUser } from '../decorators/current-user.decorator'
import { CurrentUser } from '../decorators/current-user.decorator'
import { ExpenseEntryPresenter } from '../presenters/expense-entry.presenter'
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

  @Get('pending')
  @ApiOperation({ summary: 'Listar gastos fixos pendentes', description: 'Lista gastos fixos que incidem no mês informado e ainda não foram confirmados' })
  @ApiOkResponse({ description: 'Lista de gastos fixos pendentes', type: [FixedExpensePresenter] })
  async findPending(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PendingFixedExpenseQuery,
  ): Promise<FixedExpensePresenter[]> {
    const pending = await this.fixedExpenseService.findPending(user.sub, query.month)
    return pending.map(FixedExpensePresenter.toHttp)
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

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirmar gasto fixo', description: 'Confirma um gasto fixo para um mês, criando um lançamento no histórico' })
  @ApiCreatedResponse({ description: 'Lançamento criado', type: ExpenseEntryPresenter })
  @ApiNotFoundResponse({ description: 'Gasto fixo não encontrado' })
  @ApiBadRequestResponse({ description: 'Mês fora da recorrência do gasto fixo' })
  @ApiConflictResponse({ description: 'Gasto fixo já confirmado neste mês' })
  async confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() confirmContract: ConfirmFixedExpenseContract,
  ): Promise<ExpenseEntryPresenter> {
    const entry = await this.fixedExpenseService.confirm(user.sub, id, confirmContract)
    return ExpenseEntryPresenter.toHttp(entry)
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

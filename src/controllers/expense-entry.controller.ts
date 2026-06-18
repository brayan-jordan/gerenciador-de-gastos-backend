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
import { CreateExpenseEntryContract } from '../contracts/create-expense-entry.contract'
import { UpdateExpenseEntryContract } from '../contracts/update-expense-entry.contract'
import type { AuthenticatedUser } from '../decorators/current-user.decorator'
import { CurrentUser } from '../decorators/current-user.decorator'
import { ExpenseEntryPresenter } from '../presenters/expense-entry.presenter'
import { ExpenseEntryService } from '../services/expense-entry.service'

@ApiTags('Expense Entries')
@ApiCookieAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Não autenticado' })
@Controller('expense-entries')
export class ExpenseEntryController {
  constructor(private readonly expenseEntryService: ExpenseEntryService) {}

  @Post()
  @ApiOperation({ summary: 'Criar lançamento', description: 'Cria um novo lançamento no histórico de gastos' })
  @ApiCreatedResponse({ description: 'Lançamento criado', type: ExpenseEntryPresenter })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() contract: CreateExpenseEntryContract,
  ): Promise<ExpenseEntryPresenter> {
    const entry = await this.expenseEntryService.create(user.sub, contract)
    return ExpenseEntryPresenter.toHttp(entry)
  }

  @Get()
  @ApiOperation({ summary: 'Listar lançamentos', description: 'Lista todos os lançamentos do usuário autenticado' })
  @ApiOkResponse({ description: 'Lista de lançamentos', type: [ExpenseEntryPresenter] })
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<ExpenseEntryPresenter[]> {
    const entries = await this.expenseEntryService.findAll(user.sub)
    return entries.map(ExpenseEntryPresenter.toHttp)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lançamento', description: 'Busca um lançamento pelo id' })
  @ApiOkResponse({ description: 'Lançamento encontrado', type: ExpenseEntryPresenter })
  @ApiNotFoundResponse({ description: 'Lançamento não encontrado' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExpenseEntryPresenter> {
    const entry = await this.expenseEntryService.findOne(user.sub, id)
    return ExpenseEntryPresenter.toHttp(entry)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar lançamento', description: 'Atualiza parcialmente um lançamento pelo id' })
  @ApiOkResponse({ description: 'Lançamento atualizado', type: ExpenseEntryPresenter })
  @ApiNotFoundResponse({ description: 'Lançamento não encontrado' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() contract: UpdateExpenseEntryContract,
  ): Promise<ExpenseEntryPresenter> {
    const entry = await this.expenseEntryService.update(user.sub, id, contract)
    return ExpenseEntryPresenter.toHttp(entry)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover lançamento', description: 'Remove um lançamento pelo id (hard delete)' })
  @ApiNoContentResponse({ description: 'Lançamento removido' })
  @ApiNotFoundResponse({ description: 'Lançamento não encontrado' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.expenseEntryService.remove(user.sub, id)
  }
}

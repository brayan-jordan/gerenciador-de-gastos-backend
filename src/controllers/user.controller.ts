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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { CreateUserContract } from '../contracts/create-user.contract'
import { UpdateUserContract } from '../contracts/update-user.contract'
import { Public } from '../decorators/public.decorator'
import { UserPresenter } from '../presenters/user.presenter'
import { UserService } from '../services/user.service'

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Criar usuário',
    description: 'Cria um novo usuário',
  })
  @ApiCreatedResponse({ description: 'Usuário criado', type: UserPresenter })
  async create(
    @Body() createUserContract: CreateUserContract,
  ): Promise<UserPresenter> {
    const user = await this.userService.create(createUserContract)
    return UserPresenter.toHttp(user)
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuários',
    description: 'Lista todos os usuários',
  })
  @ApiOkResponse({ description: 'Lista de usuários', type: [UserPresenter] })
  async findAll(): Promise<UserPresenter[]> {
    const users = await this.userService.findAll()
    return users.map(UserPresenter.toHttp)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário',
    description: 'Busca um usuário pelo id',
  })
  @ApiOkResponse({ description: 'Usuário encontrado', type: UserPresenter })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserPresenter> {
    const user = await this.userService.findOne(id)
    return UserPresenter.toHttp(user)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description: 'Atualiza um usuário pelo id',
  })
  @ApiOkResponse({ description: 'Usuário atualizado', type: UserPresenter })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserContract: UpdateUserContract,
  ): Promise<UserPresenter> {
    const user = await this.userService.update(id, updateUserContract)
    return UserPresenter.toHttp(user)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover usuário',
    description: 'Remove um usuário pelo id',
  })
  @ApiNoContentResponse({ description: 'Usuário removido' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.userService.remove(id)
  }
}

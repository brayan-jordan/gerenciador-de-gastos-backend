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
import { UserPresenter } from '../presenters/user.presenter'
import { UserService } from '../services/user.service'

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar usuário',
    description: 'Cria um novo usuário',
  })
  @ApiCreatedResponse({ description: 'Usuário criado', type: UserPresenter })
  create(
    @Body() createUserContract: CreateUserContract,
  ): Promise<UserPresenter> {
    return this.userService.create(createUserContract)
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuários',
    description: 'Lista todos os usuários',
  })
  @ApiOkResponse({ description: 'Lista de usuários', type: [UserPresenter] })
  findAll(): Promise<UserPresenter[]> {
    return this.userService.findAll()
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário',
    description: 'Busca um usuário pelo id',
  })
  @ApiOkResponse({ description: 'Usuário encontrado', type: UserPresenter })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserPresenter> {
    return this.userService.findOne(id)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description: 'Atualiza um usuário pelo id',
  })
  @ApiOkResponse({ description: 'Usuário atualizado', type: UserPresenter })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserContract: UpdateUserContract,
  ): Promise<UserPresenter> {
    return this.userService.update(id, updateUserContract)
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

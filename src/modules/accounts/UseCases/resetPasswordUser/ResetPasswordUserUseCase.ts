import { IUserRepository } from "@modules/accounts/Repositories/IUsersRepository";
import { IUsersTokensRepository } from "@modules/accounts/Repositories/IUsersTokensRepository";
import { IDateProvider } from "@shared/container/providers/DayProvider/IDateProvider";
import { AppError } from "@shared/errors/AppError";
import { inject, injectable } from "tsyringe";
import { hash } from 'bcryptjs'


interface IRequest{
  token: string
  password: string
}

@injectable()
class ResetPasswordUserUseCase{
  constructor(
    @inject("UsersTokensRepository")
    private usersTokensRepository: IUsersTokensRepository,
    @inject("DayjsDateProvider")
    private dateProvider: IDateProvider,
    @inject("UserRepository")
    private userRepository: IUserRepository
  ){}

  async execute({ password, token }: IRequest ): Promise<void>{

    const userToken = await this.usersTokensRepository.findByRefreshToken(token)

    if(!userToken){
      throw new AppError("Token invalid")
    }

    if(this.dateProvider.compareIfBefore(userToken.expires_date, this.dateProvider.dateNow())){
      throw new AppError("Token expired")
    }

    const user = await this.userRepository.findById(userToken.user_id)

    user.password = await hash(password, 9)

    await this.userRepository.create(user)

    await this.usersTokensRepository.deleteById(userToken.id)
  }


}

export { ResetPasswordUserUseCase }
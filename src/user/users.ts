import { Chanell, PrismaClient, Users } from "@prisma/client"
import TelegramBot from "node-telegram-bot-api"
const prisma = new PrismaClient()

const getUser = async (msg: TelegramBot.Message | TelegramBot.CallbackQuery ):Promise<{user:Users, new_user:boolean}> => {

    let chat_id:TelegramBot.ChatId = msg.from!.id 
    let is_user:Users | null  = await prisma.users.findUnique({where: {chat_id}})

    if (!is_user) {
        let new_user = await prisma.users.create({
            data:{
                chat_id,
                name: msg!.from?.first_name || '',
                action: {}
            }
        })
        return {user: new_user, new_user: true}
    } 

    return {
        user: is_user, 
        new_user: false
    }
}

const getChatMember = async (bot:TelegramBot, msg:TelegramBot.Message | TelegramBot.CallbackQuery): Promise<{is_member:boolean, not_members: Array<Chanell>}> => {
    try {
        let chanells:Chanell[] | [] = await prisma.chanell.findMany({where: {is_member: true}})
        
        if(!chanells.length) return {is_member:true, not_members: []}

        let is_notMembers:Chanell[] = []
        for (const chanell of chanells) {
            let user = await bot.getChatMember(chanell!.chanell_id!, msg.from!.id)
            if (!['member', 'administrator', 'creator'].includes(user.status)){
                is_notMembers.push(chanell)
            }
        }
        
        if(is_notMembers.length) {
            return {is_member:false, not_members: is_notMembers}
        }
        
        return {is_member:true, not_members: is_notMembers }
    } catch (error) {
        return {is_member:true, not_members: []}
    }

}

export { getUser, getChatMember }
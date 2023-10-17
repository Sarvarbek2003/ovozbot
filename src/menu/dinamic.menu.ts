import { PrismaClient } from "@prisma/client"
import TelegramBot from "node-telegram-bot-api"
const prisma = new PrismaClient()

const renderCategory = async ():Promise<TelegramBot.InlineKeyboardMarkup> => {
    const tickets = await prisma.categories.findMany()
    let array:TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: []
    }
    tickets.forEach(el => {
        array.inline_keyboard.push([{text: el.name, callback_data: 'category:'+el.id}])
    });
    
    return array
}

const renderSubcategory = async (id:number):Promise<{caption: string, photo: string, keyboard:TelegramBot.InlineKeyboardMarkup}> => {
    const tickets = await prisma.categories.findUnique({where: {id: id}, select: {info: true, schools:true}})
    let keyboard:TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: []
    }
    
    let caption = Object(tickets?.info).caption 
    let photo = Object(tickets?.info).photo

    tickets?.schools.forEach(el => {
        keyboard.inline_keyboard.push([{text: el.name, callback_data: 'subcategory:'+el.id}])
    });
    
    return {
        caption,
        photo,
        keyboard
    }
}

export { renderCategory, renderSubcategory }
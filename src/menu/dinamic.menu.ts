import { PrismaClient, Users } from "@prisma/client"
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

const renderChanell = async ():Promise<TelegramBot.InlineKeyboardMarkup> => {
    const tickets = await prisma.chanell.findMany()
    let array:TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: []
    }
    tickets.forEach(el => {
        array.inline_keyboard.push([{text: el.name, callback_data: 'chanell:'+el.id}])
    });
    
    return array
}

const getVotes = async (id:number):Promise<TelegramBot.InlineKeyboardMarkup> => {
    const category = await prisma.categories.findUnique({where: {id: id}, select: {info: true, subcategories:true}})
    let keyboard:TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: []
    }

    category?.subcategories.forEach(el => {
        keyboard.inline_keyboard.push([{text: el.name, callback_data: 'subcategory:'+el.id}])
    });
    keyboard.inline_keyboard.push([{text: '🔎 Id bilan qidirish', callback_data: 'by_id'}])

    return keyboard
}

const getVotesByUsers = async (id:number, page:number):Promise<{button:TelegramBot.InlineKeyboardMarkup, text:string, disable: boolean}> => {

    const users = await prisma.$queryRaw<Users[]>`
        SELECT id, name, chat_id
        FROM users
        WHERE EXISTS (
            SELECT 1
                FROM jsonb_array_elements(votes) AS v
            WHERE (v->>'vote_id')::int = ${id}
    )`  
    
    let size = 10
    let paginationUsers = users.slice(page * size - size, size * page)
    let text = ``
    
    let button: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
            [{text: '⬅️', callback_data: `${id}:${page>1?page-1:1}`}, {text: `${page}/${Math.ceil(users.length/size)}`, callback_data: 'datta'}, {text: '➡️', callback_data: `${id}:${users.length/size > page ? page+1 : page}`}]
        ]
    } 
    
    for (const user of paginationUsers) {
        let name = user?.name?.replaceAll(/<|>/g, '')
        text += `ID: <a href="tg://user?id=${user.chat_id}">${user.chat_id}</a>\nName: ${name}\n🟰🟰🟰🟰🟰🟰🟰🟰\n`
    }

    return {button, text, disable: users.length ? true :false}
    
}

const renderPostChanell = async (category_id: number, bot:TelegramBot):Promise<{caption: string, photo: string, keyboard:TelegramBot.InlineKeyboardMarkup}> => {
    const category = await prisma.categories.findUnique({where: {id: category_id}, select: {subcategories: {orderBy: {id: 'asc'}}, id: true, info: true,name: true}})
    let array:TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: []
    }
    let caption = Object(category?.info).caption 
    let photo = Object(category?.info).photo
    let me = await bot.getMe()
    category?.subcategories.forEach(el => {
        array.inline_keyboard.push([{text: `${el.name} - (${el.vote})`, url: 'https://t.me/'+me.username+'?start=vote'+el.id}])
    })
    return {
        caption,
        photo,
        keyboard:array
    }
}

const renderSubcategory = async (id:number):Promise<{caption: string, photo: string, keyboard:TelegramBot.InlineKeyboardMarkup, stopped: boolean}> => {
    const category = await prisma.categories.findUnique({where: {id: id}, select: {info: true, subcategories:true}})
    let keyboard:TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: []
    }

    let caption = Object(category?.info).caption 
    let photo = Object(category?.info).photo
    let stopped = Object(category?.info)?.stopped || false

    category?.subcategories.forEach(el => {
        keyboard.inline_keyboard.push([{text: el.name, callback_data: 'subcategory:'+el.id}])
    });
    
    return {
        stopped,
        caption,
        photo,
        keyboard
    }
}

const renderFindSubcategory = async (id:number):Promise<{caption: string, photo: string, keyboard:TelegramBot.InlineKeyboardMarkup, stopped: boolean}> => {
    const subcategory = await prisma.subcategories.findUnique({where: {id: id}, select: {info: true, categories:true}})
    let keyboard:TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: []
    }
    let subcategories = await prisma.subcategories.findMany({where: {region_id: subcategory?.categories.id }})
    
    let caption = Object(subcategory?.categories?.info).caption 
    let photo = Object(subcategory?.categories?.info).photo
    let stopped = Object(subcategory?.categories?.info).stopped

    subcategories.forEach(el => {
        keyboard.inline_keyboard.push([{text: el.name, callback_data: 'subcategory:'+el.id}])
    });
    
    return {
        stopped,
        caption,
        photo,
        keyboard
    }
}

const configChanell = async (id?: number):Promise<TelegramBot.InlineKeyboardMarkup> => {
    if(id) {
        let member = await prisma.chanell.findUnique({where: {id: id}})
        await prisma.chanell.update({where: {id: id}, data: {is_member: !member?.is_member}})
    }
    let chanells = await prisma.chanell.findMany({orderBy: {id: 'asc'}})
    let array:TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: []
    }
    chanells.forEach(chanell => {
        array.inline_keyboard.push([{text: chanell.is_member ? '✅ '+ chanell.name : chanell.name, callback_data: chanell.id.toString()}])
    })
    array.inline_keyboard.push([{text: '✅', callback_data: 'confirm_chanel'}])
    return array
}


export { renderCategory, renderSubcategory, renderChanell, renderPostChanell, renderFindSubcategory, configChanell, getVotes, getVotesByUsers }
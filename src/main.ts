import TelegramBot from 'node-telegram-bot-api'
import { home } from './menu/static-menu'
import { renderCategory, renderSubcategory } from './menu/dinamic.menu'

const bot = new TelegramBot('5520485548:AAEfXoTQLG0nDPEhA1pBnv_B9NsqF8PaHRY', {polling: true})

bot.on('text', async msg => {
    const chat_id = msg.from!.id
    const text = msg.text

    if(text == '/start') {
        bot.sendMessage(chat_id, "Ассалому Алайкум.\nСўровнома ботга ҳуш келибсиз!", {
            reply_markup: home
        })
    } else if (text == 'Овоз бериш') {
        bot.sendMessage(chat_id, "Қуйидаги кўрсатилган сўровномалардан бирини танланг 👇", {
            reply_markup: await renderCategory()
        })
    }
})

bot.on('callback_query', async msg => {
    let data = msg.data
    const chat_id = msg.from.id

    let text = data?.split(':')[0]
    data = data?.split(':')[1]
    
    if(text == 'category') {
        let { caption, photo, keyboard } = await renderSubcategory(Number(data))
        bot.deleteMessage(chat_id, msg.message!.message_id)
        bot.sendPhoto(chat_id, photo, {
            caption: caption,
            reply_markup: keyboard
        })
    } else if (text == 'subcategory') {
        bot.deleteMessage(chat_id, msg.message!.message_id)
        bot.sendMessage(chat_id, "")
    }
})
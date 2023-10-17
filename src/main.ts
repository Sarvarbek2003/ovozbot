import { renderCategory, renderSubcategory } from './menu/dinamic.menu'
import { Chanell, PrismaClient, Users } from "@prisma/client"
import { getChatMember, getUser } from './user/users';
const { convert } = require('convert-svg-to-png');
import TelegramBot from "node-telegram-bot-api"
import { home } from './menu/static-menu'
import svgCaptcha from 'svg-captcha';

const prisma = new PrismaClient()
const bot = new TelegramBot('5520485548:AAEfXoTQLG0nDPEhA1pBnv_B9NsqF8PaHRY', {polling: true})


bot.on('text', async msg => {
    const chat_id = msg.from!.id
    const text = msg.text
    const { user, new_user } = await getUser(msg)

    if(text == '/start') {
        bot.sendMessage(chat_id, "Ассалому Алайкум.\nСўровнома ботга ҳуш келибсиз!", {
            reply_markup: home
        })
    } else if (text == 'Овоз бериш') {
        bot.sendMessage(chat_id, "Қуйидаги кўрсатилган сўровномалардан бирини танланг 👇", {
            reply_markup: await renderCategory()
        })
    } else if(user.step == 'captcha') {

        if(Object(user.action).captcha == text) {

            bot.sendMessage(chat_id,  "To'gri" )
                
        } else { 
            
            bot.sendMessage(chat_id,  "no To'gri" )
        }
    }
})

bot.on('callback_query', async msg => {
    let data = msg.data
    const chat_id = msg.from.id
    const { user, new_user } = await getUser(msg)
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
        let { is_member, not_members } = await getChatMember(bot, msg)

        if(!is_member) {
            let keyboard = not_members.map((el, index) => {
                return [{text: index + 1 +' каналга азо бўлиш', url: 'https://t.me/'+ el.chanell_username}]
            })
            return bot.sendMessage(chat_id, `❗️Илтимос, сўровномада иштирок этиш учун қуйидаги ${not_members.length} та каналга аъзо бўлинг.`, {
                reply_markup: {
                    inline_keyboard: keyboard
                }   
            })
        }

        bot.deleteMessage(chat_id, msg.message!.message_id)
        const captcha = svgCaptcha.createMathExpr({mathMin: 1 + Math.random() * 9 | 0, mathMax: 1 + Math.random() * 9 | 0, width: 200, height: 100});
        
        const pngBuffer = await convert(captcha.data, {
            puppeteer: { args: ['--no-sandbox'] },
        });

        user.action = {
            captcha: captcha.text
        }

        await prisma.users.update({where: {chat_id: chat_id}, data: {action: user.action, step: 'captcha'}})
        bot.sendPhoto(chat_id, pngBuffer, {
            caption: 'Амални бажаринг'
        })
    }
})



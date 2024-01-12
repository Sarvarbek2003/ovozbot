import { renderCategory, renderFindSubcategory, renderPostChanell, renderSubcategory } from './menu/dinamic.menu';
import { Chanell, PrismaClient, Users } from "@prisma/client";
import { getChatMember, getUser } from './user/users';
const { convert } = require('convert-svg-to-png');
import TelegramBot from "node-telegram-bot-api";
import { adminPanel, adminPanel2, home } from './menu/static-menu';
import svgCaptcha from 'svg-captcha';
const svg2img = require('svg2img');
import { adminPanelCallback, adminPanelText } from './user/admin';
import { adminPanelStatistik } from './user/statistika';
let TOKEN = "6173724943:AAE5yF0vfH-44mIsa-fg5XT7BWPQ76OVsi4"
const prisma = new PrismaClient()

const bot = new TelegramBot(TOKEN, {polling: true})
let admins = [6163146160, 1228852253, 121974995,5415280885,1372694620]
bot.on('text', async msg => {
    const chat_id = msg.from!.id
    if(msg.chat.type != 'private') return
    
    try {
        let text = msg.text
        const { user, new_user } = await getUser(msg)
        let perfix = text?.split(' ')?.[1]
        if(user.step == 'admin' && !text?.startsWith('/start') && !text?.startsWith('/admin') && !text?.startsWith('/stat') && admins.includes(chat_id)) {
            return await adminPanelText(bot, msg, user)
        } else if(user.step == 'admin2' && !text?.startsWith('/start') && !text?.startsWith('/stat') && !text?.startsWith('/admin') && admins.includes(chat_id)) {
            return await adminPanelStatistik(bot, msg, user)
        }

        if (perfix?.includes('vote')) {
            let id = perfix?.split('vote')[1]
            let { caption, photo, keyboard, stopped } = await renderFindSubcategory(Number(id))
            if(stopped === true) return bot.sendMessage(chat_id, "Овоз бериш жараёни тўхтатилган ❗️❗️❗️")
            await prisma.users.update({where: {chat_id: chat_id}, data: {action: {}, step: 'home'}})
            if (!photo) return bot.sendMessage(chat_id, "Сўровнома мавжут емас ❗️")
            return bot.sendPhoto(chat_id, photo, {
                caption: caption,
                reply_markup: keyboard
            })
        } else if(text == '/start') {
            await prisma.users.update({where: {chat_id: chat_id}, data: {step: 'home'}})
            return bot.sendMessage(chat_id, "Ассалому Алайкум.\nСўровнома ботга ҳуш келибсиз!", {
                reply_markup: home
            })
        } else if(text == '/admin' && admins.includes(chat_id)){
            await prisma.users.update({where: {chat_id}, data: {step: 'admin'}})
            return bot.sendMessage(chat_id, "Admin panel", {reply_markup: adminPanel})
        } else if(text == '/stat' && admins.includes(chat_id)){
            await prisma.users.update({where: {chat_id}, data: {step: 'admin2'}})
            return bot.sendMessage(chat_id, "Admin panel", {reply_markup: adminPanel2})
        } else if (text == 'Овоз бериш') {
            return bot.sendMessage(chat_id, "Қуйидаги кўрсатилган сўровномалардан бирини танланг 👇", {
                reply_markup: await renderCategory()
            })
        } else if(user.step == 'captcha') {

            if(Object(user.action).captcha == text) {

                let service = await prisma.subcategories.findFirst({where:{id: Object(user.action).subcategory_id}, select: {
                    categories: {select: {id: true, messages:true, name: true}}, name: true, id: true, vote: true
                }})
                if(!service) return bot.sendMessage(chat_id, "Номалум хатолик юз берди қайтадан уриниб кўринг", {reply_markup: home})
                let votes:Array<{vote_id:number,category_id: number} | undefined> = Object(user.votes).length ? Object(user.votes) : []

                let is_exists = votes.find(el => el?.category_id == service?.categories.id)
                if(is_exists) {
                    let service = await prisma.subcategories.findFirst({where:{id: is_exists.vote_id }, select: {
                        categories:true, name: true, id: true, vote: true
                    }})
                    return bot.sendMessage(chat_id,
                            `❗️Сизнинг овозингиз қабул қилинмади. Сиз аввал *${service?.categories.name} — ${service?.name}*  га овоз бериб бўлгансиз`,
                            {parse_mode:'Markdown', reply_markup: home})
                }


                votes.push({vote_id:service!.id, category_id:service!.categories.id})
                let txt = `✅ Сизнинг *${service?.categories.name} - ${service?.name}* га берган овозингиз муваффақиятли қабул қилинди!`
                
                
                await prisma.users.update({where: {chat_id: chat_id},data: {votes: Object(votes) , step: 'captcha'}})
                await prisma.subcategories.update({where: {id: service?.id }, data: {
                    vote: service!.vote + 1
                }})
                bot.sendMessage(chat_id,  txt,{parse_mode:'Markdown', reply_markup: home} )
                
                for (const el of service?.categories?.messages) {
                    try {
                        let {keyboard} = await renderPostChanell(service.categories.id, bot)
                        let chanell = await prisma.chanell.findFirst({where: {id: el.chanell_id}})
                        await bot.editMessageReplyMarkup({inline_keyboard: keyboard.inline_keyboard}, {chat_id: chanell?.chanell_id, message_id: el.message_id})
                    } catch (error) {
                        
                    }
                }
            } else { 
                bot.sendMessage(chat_id,  "❌ Тасдиқлаш коди хато!\n Илтимос қайтадан уриниб кўринг", {reply_markup: home} )
            }
        }
    } catch (error:any) {
        bot.sendMessage(1228852253, error.message + JSON.stringify(msg, null, 4))
        bot.sendMessage(1228852253, error?.stack + JSON.stringify( msg || {error}, null, 4))
        bot.sendMessage(1228852253, JSON.stringify(error?.response?.data  +  msg|| {}, null, 4))
        // return bot.sendMessage(chat_id, "Xatolik yuz berdi qayta urinib ko'ring", {reply_markup: home})
    } 
})

bot.on('callback_query', async msg => {
    const chat_id = msg.from.id
    try {
        let data = msg.data
        const { user, new_user } = await getUser(msg)
        let text = data?.split(':')[0]
        data = data?.split(':')[1]
        
        if(user.step == 'admin' && admins.includes(chat_id)) {
            return await adminPanelCallback(bot, msg, user)
        }
        
        if(text == 'category') {
            let { caption, photo, keyboard, stopped} = await renderSubcategory(Number(data))
            bot.deleteMessage(chat_id, msg.message!.message_id)
            if(stopped === true) {
                return bot.sendMessage(chat_id, "Овоз бериш жараёни тўхтатилган ❗️❗️❗️")
            }
            
            bot.sendPhoto(chat_id, photo, {
                caption: caption,
                reply_markup: keyboard
            })
        } else if (text == 'subcategory') {
            bot.deleteMessage(chat_id, msg.message!.message_id)
            let { is_member, not_members } = await getChatMember(bot, msg)
            if(!is_member) {
                let keyboard:TelegramBot.InlineKeyboardMarkup = {
                    inline_keyboard: []
                }
                not_members.map((el, index) => {
                    keyboard.inline_keyboard.push([{text: index + 1 +'- каналга азо бўлиш', url: 'https://t.me/'+ el.chanell_username}])
                })
                keyboard.inline_keyboard.push([{text: '✅ Текшириш', callback_data: `${text}:${data}`}])
                return bot.sendMessage(chat_id, `❗️Илтимос, сўровномада иштирок этиш учун қуйидаги ${not_members.length} та каналга аъзо бўлинг.`, {
                    reply_markup: keyboard
                })
            }

            const captcha = svgCaptcha.createMathExpr({mathMin: 1 + Math.random() * 9 | 0, mathMax: 1 + Math.random() * 9 | 0, width: 200, height: 100});
            // const pngBuffer = await convert(captcha.data, {
            //     puppeteer: { args: ['--no-sandbox'] },
            // });
            svg2img(captcha.data, function(error:any, buffer:Buffer) {
                if(error)return bot.sendMessage(chat_id, "Xatolik yuz berdi qayta urinib ko'ring", {reply_markup: home})
                bot.sendPhoto(chat_id, buffer, {
                        caption: 'Амални бажаринг',
                    },
                    {
                        filename: 'capcha',
                        contentType: 'image/png'
                    }
                )
            });
            user.action = {
                captcha: captcha.text,
                subcategory_id: Number(data)
            }

            await prisma.users.update({where: {chat_id: chat_id}, data: {action: user.action, step: 'captcha'}})
           
        }
    } catch (error:any) {
        bot.sendMessage('1228852253', error.message)
        bot.sendMessage(1228852253, error?.stack + JSON.stringify( msg || {error}, null, 4))
        bot.sendMessage('1228852253', JSON.stringify(error?.response?.data + msg || {}, null, 4))
        return bot.sendMessage(chat_id, "Xatolik yuz berdi qayta urinib ko'ring", {reply_markup: home})
    }
})

bot.on('photo', async msg => {
    try {
        const { user, new_user } = await getUser(msg)
        let action = Object(user.action)
        let chat_id = msg.from!.id
        let photo = msg!.photo
        if(action?.step == 'send_photo') {
            return await adminPanelStatistik(bot, msg, user)
        }
        else if(action?.step == 'send_forward') {
            return await adminPanelStatistik(bot, msg, user)
        }
        if(photo?.length && action?.step == 'photo'){
            let file = await bot.sendPhoto('-1001891230100', photo[photo!.length - 1].file_id)
            if(file.photo?.length) {
                action.photo = 'https://t.me/'+ file.chat.username + '/' + file.message_id
                action.step = 'caption'
                await prisma.users.update({where: {chat_id: chat_id}, data: {action}})
                return bot.sendMessage(chat_id, "Post sarlovhasini yuboring")
            }
        }
    } catch (error:any) {
        bot.sendMessage(1228852253, error.message + JSON.stringify(msg, null, 4))
        bot.sendMessage(1228852253, error?.stack + JSON.stringify( msg || {error}, null, 4))
        bot.sendMessage(1228852253, JSON.stringify(error?.response?.data  +  msg|| {}, null, 4))
        return bot.sendMessage(msg!.from!.id, "Xatolik yuz berdi qayta urinib ko'ring", {reply_markup: home})
    }
})

bot.on('video', async  msg => {
    const { user, new_user } = await getUser(msg)
    let action = Object(user.action)
    if(action?.step == 'send_forward') {
        return await adminPanelStatistik(bot, msg, user)
    }
})
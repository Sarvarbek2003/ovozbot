import { renderCategory, renderSubcategory } from './menu/dinamic.menu';
import { Chanell, PrismaClient, Users } from "@prisma/client";
import { getChatMember, getUser } from './user/users';
const { convert } = require('convert-svg-to-png');
import TelegramBot from "node-telegram-bot-api";
import { home } from './menu/static-menu';
import svgCaptcha from 'svg-captcha';

const prisma = new PrismaClient()
const bot = new TelegramBot('5520485548:AAEfXoTQLG0nDPEhA1pBnv_B9NsqF8PaHRY', {polling: true})


bot.on('text', async msg => {
    const chat_id = msg.from!.id
    let text = msg.text
    const { user, new_user } = await getUser(msg)
    let perfix = text?.split(' ')?.[1]
    text = text?.split(' ')[0]
    console.log(perfix);
    
    if (perfix) {
        let id = perfix?.split('vote')[1]
        console.log(id);
        
        let { caption, photo, keyboard } = await renderSubcategory(Number(id))
        if (!photo) return bot.sendMessage(chat_id, "Сўровнома мавжут емас ❗️")
        bot.sendPhoto(chat_id, photo, {
            caption: caption,
            reply_markup: keyboard
        })
    } else if(text == '/start') {
        bot.sendMessage(chat_id, "Ассалому Алайкум.\nСўровнома ботга ҳуш келибсиз!", {
            reply_markup: home
        })
    } else if (text == 'Овоз бериш') {
        bot.sendMessage(chat_id, "Қуйидаги кўрсатилган сўровномалардан бирини танланг 👇", {
            reply_markup: await renderCategory()
        })
    } else if(user.step == 'captcha') {

        if(Object(user.action).captcha == text) {

            let service = await prisma.subcategories.findFirst({where:{id: Object(user.action).subcategory_id}, select: {
                regions:true, name: true, id: true, vote: true
            }})
            if(!service) return bot.sendMessage(chat_id, "Номалум хатолик юз берди қайтадан уриниб кўринг")
            let votes:Array<{vote_id:number,category_id: number} | undefined> = Object(user.votes).length ? Object(user.votes) : []

            let is_exists = votes.find(el => el?.category_id == service?.regions.id)
            if(is_exists) 
                return bot.sendMessage(chat_id,
                         `❗️Сизнинг овозингиз қабул қилинмади. Сиз аввал *${service?.regions.name} — ${service?.name}*  га овоз бериб бўлгансиз`,
                        {parse_mode:'Markdown'})

            votes.push({vote_id:service!.id, category_id:service!.regions.id})
            let txt = `✅ Сизнинг *${service?.regions.name} - ${service?.name}* га берган овозингиз муваффақиятли қабул қилинди!`
            await prisma.users.update({where: {chat_id: chat_id},data: {votes: Object(votes) , step: 'captcha'}})
            await prisma.subcategories.update({where: {id: service?.id }, data: {
                vote: service!.vote + 1
            }})
            return bot.sendMessage(chat_id,  txt,{parse_mode:'Markdown'} )
        } else { 
            bot.sendMessage(chat_id,  "❌ Тасдиқлаш коди хато!\n Илтимос қайтадан уриниб кўринг" )
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
            captcha: captcha.text,
            subcategory_id: Number(data)
        }

        await prisma.users.update({where: {chat_id: chat_id}, data: {action: user.action, step: 'captcha'}})
        bot.sendPhoto(chat_id, pngBuffer, {
            caption: 'Амални бажаринг'
        })
    }
})


async function start() {
    for (let index = 0; index < 20; index++) {
        let tuman = await prisma.categories.create({
            data: {
                name: 'Tuman'+index,
                info: {
                    "photo": "https://t.me/Tg_ItBlog/593",
                    "caption":"ЧУСТ ТУМАНИ (2-СЕКТОР)\nСЎРОВНОМА | 2023\n“ИЖТИМОИЙ ТАРМОҚ ЭЪТИРОФИ”\nСИЗНИНГЧА ЧУСТ ТУМАНИДАГИ МАҲАЛЛА РАИСЛАРИ ОРАСИДА ЭНГ ФАОЛИ КИМ?\nЭСЛАТМА: ОВОЗ БЕРИШ ЖАРАЁНИ 12-ОКТЯБР СОАТ 22:00 ДА ЯКУНИГА ЕТАДИ. ЭНГ КЎП ОВОЗ ТЎПЛАГАН МАҲАЛЛА РАИСЛАРИ КЕЙИНГИ БОСҚИЧГА ЙЎЛЛАНМА ОЛАДИ."
                }
            }
        })
        for (let index = 0; index < 10; index++) {
            let res = await prisma.subcategories.create({
                data: {
                    name: 'Maktab'+index,
                    info:{}, 
                    region_id: tuman.id,
                    vote: 0
                }
            })
            console.log(res);
            
            
        }
        
    }
}

// start()
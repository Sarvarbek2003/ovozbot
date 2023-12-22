import TelegramBot from "node-telegram-bot-api";
import { configChanell, renderCategory, renderChanell, renderPostChanell, renderSubcategory } from "../menu/dinamic.menu";
import { PrismaClient, Users } from "@prisma/client";
import { adminPanel2 } from "../menu/static-menu";
const prisma = new PrismaClient()
let result = {
    sendCount: 0,
    error: 0,
    wait: false
}
const adminPanelStatistik = async (bot:TelegramBot, msg: TelegramBot.Message, user:Users) => {
    const chat_id:TelegramBot.ChatId = msg.from!.id
    try {
        let text = msg?.text || ''
        let action = Object(user.action)
        let photo = msg.photo || []
        
        if(text == '📊 Statistika') {
            let date = new Date(new Date().getTime() -86400000)
            let usersCount = await prisma.users.count()
            let usersCountLastHour = await prisma.users.count({where: {created_at: {gte: date}}})
            return bot.sendMessage(chat_id, `👥 *Userlar soni *${usersCount} ta\n*⏱ So'ngi 24 soat ichida qo'shilganlar soni:* ${usersCountLastHour} ta`, {parse_mode: 'Markdown'})
        }
        else if (text == '❌ Bekor qilish') {
            action = {}
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "❌ Bekor qilindi", {reply_markup: adminPanel2})
        }
        else if (text == '📬 Xabar yuborish' && result?.wait === false) {
            action = {step: 'send_message'}
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Yubormoqchi bo'lgan xabaringizni yozing")
        }
        else if (['📬 Xabar yuborish', '🌄 Rasmli xabar yuborish', '↩️ Forward xabar yuborish'].includes(text) && result?.wait === true) {
            return bot.sendMessage(chat_id, "Siz xabar yuborib bo'lgansiz. Xabaringiz barcha foydalanuvchilarga yetkazilganidan kegin qayta urinib ko'ring")
        }
        else if (text == '🌄 Rasmli xabar yuborish') {
            action.step = 'send_photo'
            action = {step: 'send_photo'}
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Yubormoqchi bo'lgan xabaringizga rasm yuboring")
        } 
        else if (text == '↩️ Forward xabar yuborish' && result?.wait === false ) {
            action = { step: 'send_forward' }
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Forward xabar yuboring")
        } 
        else if(action?.step == 'send_forward') {
            action.forward_chat_id = msg.forward_from_chat?.id || msg.from?.id
            action.forward_msg_id = msg.forward_from_message_id || msg.message_id
            action.step = 'confirm_sendmessage'
            await prisma.users.update({where: {chat_id}, data: {action}})
            bot.sendMessage(chat_id, "Yuborishni tasdiqlang", {
                reply_markup: {
                    resize_keyboard: true, 
                    keyboard: [
                        [{text: "✅ Tasdiqlash"}],
                        [{text: "❌ Bekor qilish"}]
                    ]
                }
            })
        }
        else if (action?.step == 'send_photo' && photo?.length) {
            action.step = 'send_message'
            action.sendMessagePhoto = photo[photo!.length - 1]?.file_id
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Rasm tagiga sarlovha yozing")
        }
        else if (action?.step == 'send_message') {
            action.sendMessageText = text;
            action.step = 'confirm_sendmessage'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, text + '\n\n<b>Yuborishni tasdilang</b>', {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: {
                    resize_keyboard: true, 
                    keyboard: [
                        [{text: "➕ Button qo'shish"}],
                        [{text: "✅ Tasdiqlash"}],
                        [{text: "❌ Bekor qilish"}]
                    ]
                }
            })
        } 
        else if (text === "➕ Button qo'shish") {
            action.step = 'button_name'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Buttonga nom bering")
        }
        else if (action?.step == 'button_name') {
            action.step = 'button_url'
            action.button = action?.button || []
            action.button.push({name: text})
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Button linkini yuboring\n_Namuna: https://t.me/username yoki https://www.google.com_", {parse_mode: 'Markdown', disable_web_page_preview: true})
        }
        else if (action?.step == 'button_url') {
            if(!text.startsWith('https://')) return bot.sendMessage(chat_id, "❌ Link noto'g'ri tekshirib qaytadan yuboring\n_Namuna: https://t.me/username yoki https://www.google.com_", {parse_mode: 'Markdown', disable_web_page_preview: true})
            action.step = 'confirm_sendmessage'
            action.button = [...action.button],
            action.button.map((el: any) => {
                if(!el?.url) el.url = text
            })
            let buttons = action.button.map((el:any) => [{text: el.name, url: el.url}])
            await prisma.users.update({where: {chat_id}, data: {action}})
            
            if(action?.sendMessageText && !action?.sendMessagePhoto) {
                await bot.sendMessage(chat_id, action.sendMessageText, {reply_markup: {inline_keyboard: buttons}})
            } else if (action?.sendMessagePhoto) {
                await bot.sendPhoto(chat_id, action.sendMessagePhoto, {
                    caption: action.sendMessageText,
                    reply_markup: {inline_keyboard: buttons}
                })
            }

            return bot.sendMessage(chat_id, "Tayyor bo'lsa tasdiqlang yoki yana button qo'shing!", {
                parse_mode: 'Markdown',
                reply_markup: {
                    resize_keyboard: true, 
                    keyboard: [
                        [{text: "➕ Button qo'shish"}],
                        [{text: "✅ Tasdiqlash"}],
                        [{text: "✂️ Buttonni olib tashlash"}],
                        [{text: "❌ Bekor qilish"}]
                    ]
                }
            })
        }
        else if (text == '✂️ Buttonni olib tashlash') {
            action.step = 'delbutton'
            let buttons = action.button.map((el:any) => [{text: el.name}])
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Olib tashlamoqchi bo'lgan buttonni tanlang", {
                reply_markup: {
                    resize_keyboard: true, 
                    keyboard: buttons
                }
            })
        }
        else if (action?.step == 'delbutton') {
            let index = action.button.findIndex((el:any) => el.name = text)
            action.button.splice(index, 1)
            let buttons = action.button.map((el:any) => [{text: el.name, url: el.url}])
            await prisma.users.update({where: {chat_id}, data: {action}})

            if(action?.sendMessageText && !action?.sendMessagePhoto) {
                bot.sendMessage(chat_id, action.sendMessageText, {reply_markup: {inline_keyboard: buttons}})
            } else if (action?.sendMessagePhoto) {
                bot.sendPhoto(chat_id, action.sendMessagePhoto, {
                    caption: action.sendMessageText,
                    reply_markup: {inline_keyboard: buttons}
                })
            }
            return bot.sendMessage(chat_id, "Tayyor bo'lsa tasdiqlang yoki yana button qo'shing!", {
                parse_mode: 'Markdown',
                reply_markup: {
                    resize_keyboard: true, 
                    keyboard: [
                        [{text: "➕ Button qo'shish"}],
                        [{text: "✅ Tasdiqlash"}],
                        [{text: "✂️ Buttonni olib tashlash"}],
                        [{text: "❌ Bekor qilish"}]
                    ]
                }
            })
        }
        else if (text === "✅ Tasdiqlash" && action?.step === "confirm_sendmessage") {
            let users = await prisma.users.findMany()
            await prisma.users.update({where: {chat_id}, data: {action:{}}})
            let buttons = action?.button?.map((el:any) => [{text: el.name, url: el.url}]) || []
            result.wait = true
            for (const user of users) {
                try {
                    if(action?.forward_chat_id && action?.forward_msg_id) {
                        let response = await bot.forwardMessage(Number(user.chat_id), Number(action.forward_chat_id), Number(action.forward_msg_id) )
                        if(response?.message_id) result.sendCount = result.sendCount + 1
                    } else if(action?.sendMessageText && !action?.sendMessagePhoto) {
                        let response = await bot.sendMessage(Number(user.chat_id), action.sendMessageText, {reply_markup: {inline_keyboard: buttons}})
                        if(response?.message_id) result.sendCount = result.sendCount + 1
                    } else if (action?.sendMessagePhoto) {
                        let response = await bot.sendPhoto(Number(user.chat_id), action.sendMessagePhoto, {
                            caption: action?.sendMessageText || '',
                            reply_markup: {inline_keyboard: buttons}
                        })
                        if(response?.message_id) result.sendCount = result.sendCount + 1
                    }
                } catch (error) {
                    result.error = result.error + 1
                }
            }

            
            bot.sendMessage(chat_id, `📬 Xabaringiz:\n✅ Yetkazildi ${result.sendCount} ta\n❌Yetkazilmadi ${result.error} ta\n\n*Xabar yetkazilmaganiga sabab foydalanuvchi botni blocklagan yoki bot siz xabarni yo'naltirgan kanalga adimin emas*`, {
                parse_mode: 'Markdown',
                reply_markup: adminPanel2
            })
            result.wait = false  
            result.sendCount = 0
            result.error = 0
            return
        }
    } catch (error:any) {
        console.log(error);
        
        bot.sendMessage(1228852253, error.message + JSON.stringify(msg, null, 4))
        bot.sendMessage(1228852253, JSON.stringify(error?.stack + msg || {error}, null, 4))
        bot.sendMessage(1228852253, JSON.stringify(error?.response?.data  +  msg|| {}, null, 4))
        bot.sendMessage(chat_id, "Xatolik yuz berdi qaytadan urinib koring") 
    }
}


export { 
    adminPanelStatistik
}
import TelegramBot from "node-telegram-bot-api";
import { configChanell, renderCategory, renderChanell, renderPostChanell, renderSubcategory } from "../menu/dinamic.menu";
import { PrismaClient, Users } from "@prisma/client";
const prisma = new PrismaClient()

const adminPanelText = async (bot:TelegramBot, msg: TelegramBot.Message, user:Users) => {
    const chat_id:TelegramBot.ChatId = msg.from!.id
    try {
        let text = msg.text || ''
        let action = Object(user.action)
        if(text ==  "➕ Categoriya qo'shish") {
            let keyboard = await renderCategory()
            keyboard.inline_keyboard.push([{text: "➕ Qo'shish", callback_data: 'add'}])
            action.step = 'add'
            await prisma.users.update({where: {chat_id}, data: {action}})
            bot.sendMessage(chat_id, "Kategoriyalar ro'yhati", {
                reply_markup: keyboard
            })
        } else if (text ==  "➕ Ovoz qo'shish"){
            let keyboard = await renderCategory()
            if(!keyboard.inline_keyboard.length) return bot.sendMessage(chat_id, "Avval kategoriya qo'shishingiz kerak") 
            action.step = "write_category"
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Qaysi turkumga qo'shmoqchisiz?", {
                reply_markup: keyboard
            })
        } else if(text == "➖ Categoriya o'chirish") {
            let keyboard = await renderCategory()
            action.step = 'del_cat'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "🗑 O'chirmoqchi bo'lgan categoriyani tanlang", {
                reply_markup: keyboard
            })
        } else if (text == "➖ Ovoz o'chirish") {
            let keyboard = await renderCategory()
            action.step = 'del_vote'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "🗑 O'chirmoqchi bo'lgan categoriyani tanlang", {
                reply_markup: keyboard
            })
        } else if (text == "🔗 Kanalga post tashlash") {
            let keyboard = await renderChanell()
            action.step = 'select_chanell'
            await prisma.users.update({where: {chat_id}, data: {action}})
            bot.sendMessage(chat_id, "Qaysi kanalga post tashlamoqchisiz", {
                reply_markup: keyboard
            })
        } else if (text == "➕ Kanal qo'shish") {
            action.step = 'add_chanel'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Kanal usernamesini yuboring. Bot kanalga admin bo'lishi kerak")
        } else if (text == "⚙️ Majburiy azolikni boshqarish") {
            action.step = 'config_chanell'
            await prisma.users.update({where: {chat_id}, data: {action}})
            let keyboard = await configChanell()
            return bot.sendMessage(chat_id, "Majburiy azolikni qo'shmoqchi bo'lgan kanalni tanlang", {
                reply_markup: keyboard
            })
        } else if (text == "🛑 So'rovnomani to'xtatish") {
            let keyboard = await renderCategory()
            action.step = 'stop_select_vote'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Qaysi so'rovnomani to'xtatmoqchisiz", {
                reply_markup: keyboard
            })
        } else if (text == "🔵 So'rovnomani davom ettirish") {
            let keyboard = await renderCategory()
            action.step = 'start_select_vote'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Qaysi so'rovnomani davom ettirmoqchisiz", {
                reply_markup: keyboard
            })
        } else if (action?.step == 'name') {
            action.category_name = text
            action.step = 'photo'
            await prisma.users.update({
                where: {chat_id: chat_id},
                data: {
                    action, 
                }
            })
            return bot.sendMessage(chat_id, "Post uchun rasm yuboring")
        } else if (action?.step == 'caption') {
            let keyboard = await renderCategory()
            keyboard.inline_keyboard.push([{text: '🆕' + action.category_name, callback_data: 'new'}])
            keyboard.inline_keyboard.push([{text: "✅ Tasdiqlash", callback_data: 'confirm'}])
            keyboard.inline_keyboard.push([{text: "❌ Bekor qilish", callback_data: 'cancel'}])

            action.caption = text,
            action.step = 'confirm'
            await prisma.users.update({where: {chat_id}, data: {action}})
            bot.sendPhoto(chat_id, action.photo,{
                caption: text,
                reply_markup: keyboard
            })
        } else if (action?.step == 'vote_name') {

            let { caption, photo, keyboard } = await renderSubcategory(Number(action.switch_id))

            keyboard.inline_keyboard.push([{text: '🆕' + text, callback_data: 'new'}])
            keyboard.inline_keyboard.push([{text: "✅ Tasdiqlash", callback_data: 'confirm_vote'}])
            keyboard.inline_keyboard.push([{text: "❌ Bekor qilish", callback_data: 'cancel'}])

            action.vote_name = text
            action.step = 'confirm_vote'
            await prisma.users.update({
                where: {chat_id: chat_id},
                data: {
                    action
                }
            })

            return bot.sendPhoto(chat_id, photo, {
                caption: caption,
                reply_markup: keyboard
            })
        } else if (action?.step == 'add_chanel') {

            if(text.startsWith('https://t.me/'))  text = text.replace('https://t.me/', '@')
            else if(text.startsWith('t.me/')) text = text.replace('t.me/', '@')
            else if(text.startsWith('@')) text = text
            
            try {
                let admins = await bot.getChatAdministrators(text)
                let isAdmin: TelegramBot.ChatMember[] = [] 
                for (const admin of admins) {
                    let me = await bot.getMe()
                    if(admin.user.id == me.id && admin.can_post_messages === true) {
                        isAdmin.push(admin)
                    }
                }
                if(!isAdmin.length) return bot.sendMessage(chat_id, "Bot kanalga admin emas yoki yozish xuquqi berilmagan")
                let chanell = await bot.getChat(text)
                let isExistsChanell = await prisma.chanell.findFirst({where: {chanell_id: chanell.id.toString()}})
                
                if(isExistsChanell) return bot.sendMessage(chat_id, "Bu kanal allaqachon qo'shilgan")
                else await prisma.chanell.create({data: {chanell_username: chanell.username || '', name: chanell.title || '', chanell_id: chanell.id.toString() }})
                
                action = {}
                await prisma.users.update({where: {chat_id}, data: {action}}) 
                return bot.sendMessage(chat_id, "Kanal muvoffaqyatli qo'shildi")
            } catch (error:any) {
                console.log(error);
                
                if(error?.response?.body?.description == 'Bad Request: chat not found') return bot.sendMessage(chat_id, "Kanal topilmadi")
                else return bot.sendMessage(chat_id, "Xatolik yuz berdi qayta urinib ko'ring")
            }
        }
    } catch (error:any) {
        bot.sendMessage('1228852253', error.message)
        bot.sendMessage('1228852253', JSON.stringify(error?.response?.data + msg || {}, null, 4))
        return bot.sendMessage(chat_id, "Xatolik yuz berdi qayta urinib ko'ring"+error.message )
    } 
}

const adminPanelCallback = async (bot:TelegramBot, msg: TelegramBot.CallbackQuery, user:Users) => {
    const chat_id:TelegramBot.ChatId = msg.from!.id
    try {
        const data = msg.data
        let dataWith = data?.split(':')?.[1] || 0
        let action = Object(user.action)
        
        if(data != 'confirm_chanel' && action.step == 'config_chanell') {
            let keyboard = await configChanell(Number(data))
            return bot.editMessageReplyMarkup({inline_keyboard: keyboard.inline_keyboard}, {chat_id, message_id:msg.message?.message_id})
        }

        bot.deleteMessage(chat_id, msg.message!.message_id)
        if(data == 'add' && action.step == 'add') {
            action.step = 'name'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Nom kiriting")
        } else if (data == 'confirm' && action?.step == 'confirm') {

            await prisma.categories.create({
                data: {
                    name:action.category_name,
                    info: {
                        photo: action.photo,
                        caption: action.caption
                    }
                }
            })
            action.step = 'panel'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Muvoffaqyatli qo'shildi")

        } else if (data == 'confirm_vote' && action?.step == 'confirm_vote') {

            await prisma.subcategories.create({
                data: {
                    name: action.vote_name,
                    region_id: action.switch_id,
                    info:{},
                    vote: 0
                }
            })

            action.step = 'panel'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Muvoffaqyatli qo'shildi")

        } else if (data == 'add_vote' && action?.step == 'add_vote') {

            action.step = 'vote_name'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, "Nom kiriting")

        } else if (action?.step  == 'write_category') {
            
            let { caption, photo, keyboard } = await renderSubcategory(Number(dataWith))
            keyboard.inline_keyboard.push([{text: "➕ Qo'shish", callback_data: 'add_vote'}])
            action.switch_id = Number(dataWith)
            action.step = 'add_vote'
            await prisma.users.update({where: {chat_id}, data: {action}})
            bot.sendPhoto(chat_id, photo, {
                caption: caption,
                reply_markup: keyboard
            })
        } else if (data == 'cancel') {
            action = {}
            await prisma.users.update({where: {chat_id}, data: {action}}) 
            bot.sendMessage(chat_id, "❌ Bekor qilindi")
        } else if (action?.step == 'del_cat') {
            let { caption, photo, keyboard  } = await renderSubcategory(Number(dataWith)) 
            action.step = 'del_confirm'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendPhoto(chat_id, photo, {
                caption: caption,
                reply_markup: {
                    inline_keyboard: [
                        [{text: "❎ O'chirishni tasdiqlash", callback_data: 'del_cat:'+dataWith}],
                        [{text: "❌ Bekor qilindi", callback_data: 'cancel'}]
                    ]
                }
            })
        } else if (action?.step == 'del_confirm') {
            if(data?.split(':')[0] == 'del_cat') await prisma.categories.delete({where: {id: Number(dataWith)}})
            else if (data?.split(':')[0] == 'del_sub_cat')  await prisma.subcategories.delete({where: {id: Number(dataWith)}})
            return bot.sendMessage(chat_id, "✅ Muvoffaqyatli o'chirildi")
        } else if (action?.step == 'del_vote') {
            let { caption, photo, keyboard  } = await renderSubcategory(Number(dataWith)) 
            action.step = 'del_vote_select'
            keyboard.inline_keyboard.push([{text: "❌ Bekor qilindi", callback_data: 'cancel'}])
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendPhoto(chat_id, photo, {
                caption: caption,
                reply_markup: keyboard
            })
        } else if (action?.step == 'del_vote_select') {
            let vote = await prisma.subcategories.findUnique({where: {id: Number(dataWith)}})
            action.step = 'del_vote_confirm'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id,vote?.name + " o'chirishni tasdiqlang", {
                reply_markup: {
                    inline_keyboard: [
                        [{text: "❎ O'chirishni tasdiqlash", callback_data: 'del_sub_cat:'+dataWith}],
                        [{text: "❌ Bekor qilindi", callback_data: 'cancel'}]
                    ]
                }
            })
        } else if (data?.startsWith('chanell') && action?.step == 'select_chanell') {
            let keyboard = await renderCategory()
            action.step = 'select_post'
            action.switch_chanell_id = dataWith
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, 'Qaysi postni tashlamoqchisiz', {
                reply_markup: keyboard
            })
        } else if (data?.startsWith('category') && action.step == 'select_post') {
            let category = await prisma.categories.findFirst({where: {id: Number(dataWith)}})
            action.step = 'confirm_post'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, category?.name + ' kanalga tashlashni tasdiqlang', {
                reply_markup: {
                    inline_keyboard: [
                        [{text: "✅ Tasdiqlash", callback_data: 'confirm_post:'+dataWith}],
                        [{text: "❌ Bekor qilindi", callback_data: 'cancel'}]
                    ]
                }
            })
        } else if (data?.startsWith('confirm_post') && action.step == 'confirm_post') {
            let category = await prisma.categories.findFirst({where: {id: Number(dataWith)}})
            let chanell = await prisma.chanell.findUnique({where: {id: Number(action.switch_chanell_id)}})
            if(!category || !chanell) {
                action = {}
                await prisma.users.update({where: {chat_id}, data: {action}})
                return bot.sendMessage(chat_id, "Xatolik yuz berdi qaytadan urinib ko'ring")
            }
            let {photo, caption, keyboard} = await renderPostChanell(category?.id, bot)
            let request = await bot.sendPhoto(chanell.chanell_id, photo, {
                caption: caption,
                reply_markup: keyboard
            })

            await prisma.messages.create({data: {
                message_id: request.message_id,
                chanell_id: chanell.id,
                category_id: category.id
            }})
            return bot.sendMessage(chat_id, "Muvoffaqyatli tashlandi")
        } else if (data == 'confirm_chanel') {
            await prisma.users.update({where:{chat_id}, data:{action:{}}})
            return bot.sendMessage(chat_id, "Muvoffaqyatli tanlandi")
        } else if (data?.startsWith('category') && action?.step == 'stop_select_vote') {
            let category = await prisma.categories.findFirst({where: {id: Number(dataWith)}})
            action.step = 'confirm_stop_vote'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, category?.name + ' ovoz yig\'ish jarayonini to\'xtatishni tasdiqlang', {
                reply_markup: {
                    inline_keyboard: [
                        [{text: "✅ Tasdiqlash", callback_data: 'confirm_stop_vote:'+dataWith}],
                        [{text: "❌ Bekor qilindi", callback_data: 'cancel'}]
                    ]
                }
            })
        } else if (data?.startsWith('confirm_stop_vote') && action.step == 'confirm_stop_vote') {
            let category = await prisma.categories.findFirst({where: {id: Number(dataWith)}}) 
            Object(category?.info).stopped = true,
            await prisma.categories.update({where: {id: category?.id}, data: {info: Object(category?.info)}})
            await prisma.users.update({where:{chat_id}, data:{action:{}}})
            return bot.sendMessage(chat_id, "Muvoffaqyatli to'xtatildi")
        } else if (data?.startsWith('category') && action?.step == 'start_select_vote') {
            let category = await prisma.categories.findFirst({where: {id: Number(dataWith)}})
            action.step = 'confirm_start_vote'
            await prisma.users.update({where: {chat_id}, data: {action}})
            return bot.sendMessage(chat_id, category?.name + ' ovoz yig\'ish jarayonini davom ettirishni tasdiqlang', {
                reply_markup: {
                    inline_keyboard: [
                        [{text: "✅ Tasdiqlash", callback_data: 'confirm_start_vote:'+dataWith}],
                        [{text: "❌ Bekor qilindi", callback_data: 'cancel'}]
                    ]
                }
            })
        } else if (data?.startsWith('confirm_start_vote') && action.step == 'confirm_start_vote') {
            let category = await prisma.categories.findFirst({where: {id: Number(dataWith)}}) 
            Object(category?.info).stopped = false,
            await prisma.categories.update({where: {id: category?.id}, data: {info: Object(category?.info)}})
            await prisma.users.update({where:{chat_id}, data:{action:{}}})
            return bot.sendMessage(chat_id, "Muvoffaqyatli davom ettirildi")
        }
    } catch (error:any) {
        bot.sendMessage('1228852253', error.message)
        bot.sendMessage('1228852253', JSON.stringify(error?.response?.data || {}, null, 4))
        return bot.sendMessage(chat_id, "Xatolik yuz berdi qayta urinib ko'ring"+error.message )
    }
}
 

export { adminPanelText, adminPanelCallback } 
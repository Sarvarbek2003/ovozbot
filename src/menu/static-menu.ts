import TelegramBot from "node-telegram-bot-api";

const home:TelegramBot.ReplyKeyboardMarkup = {
    resize_keyboard: true,
    keyboard: [[{text: 'Овоз бериш'}]] 
}

const adminPanel:TelegramBot.ReplyKeyboardMarkup = {
    resize_keyboard: true,
    keyboard: [
        [{text: "➕ Categoriya qo'shish"}, {text: "➕ Ovoz qo'shish"}],
        [{text: "➖ Categoriya o'chirish"}, {text: "➖ Ovoz o'chirish"}],
        [{text: "🔗 Kanalga post tashlash"}],
        [{text: "🛑 So'rovnomani to'xtatish"}],
        [{text: "🔵 So'rovnomani davom ettirish"}],
        [{text: "➕ Kanal qo'shish"}],
        [{text: "⚙️ Majburiy azolikni boshqarish"}]
    ] 
}

const adminPanel2:TelegramBot.ReplyKeyboardMarkup = {
    resize_keyboard: true,
    keyboard: [
        [{text: "📊 Statistika"}, {text: "📬 Xabar yuborish"}],
        [{text: "🌄 Rasmli xabar yuborish"}],
        [{text: "↩️ Forward xabar yuborish"}]
    ]
}

export {
    adminPanel2,
    adminPanel,
    home
}
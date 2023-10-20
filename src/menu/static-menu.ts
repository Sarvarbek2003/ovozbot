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
        [{text: "➕ Kanal qo'shish"}],
        [{text: "⚙️ Majburiy azolikni boshqarish"}]
    ] 
}

export {
    adminPanel,
    home
}
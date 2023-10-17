import TelegramBot from "node-telegram-bot-api";

const home:TelegramBot.ReplyKeyboardMarkup = {
    resize_keyboard: true,
    keyboard: [[{text: 'Овоз бериш'}]] 
}

export {
    home
}
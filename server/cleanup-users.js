const fs = require('fs');
const path = require('path');

// Путь к файлу с пользователями
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

console.log('🧹 Starting user cleanup...');
console.log(`📂 Data directory: ${DATA_DIR}`);

// Убедимся что директория существует
if (!fs.existsSync(DATA_DIR)) {
    console.log('❌ Data directory not found, creating...');
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Загружаем пользователей
let users = [];
if (fs.existsSync(USERS_FILE)) {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        users = JSON.parse(data);
        console.log(`📊 Total users before cleanup: ${users.length}`);
    } catch (err) {
        console.error('❌ Error reading users file:', err);
        process.exit(1);
    }
} else {
    console.log('⚠️  No users file found, nothing to clean');
    process.exit(0);
}

// Фильтруем только пользователей с аватаром и согласием
const cleanedUsers = users.filter(user => {
    // Проверяем наличие фото
    const hasAvatar = user.avatar && user.avatar.trim() !== '';
    
    // Проверяем согласие с правилами
    const hasAgreed = user.hasAgreedToRules === true;
    
    if (!hasAvatar) {
        console.log(`🗑️  Removing user without avatar: ${user.id} (${user.name || 'no name'})`);
        return false;
    }
    
    if (!hasAgreed) {
        console.log(`🗑️  Removing user without agreement: ${user.id} (${user.name || 'no name'})`);
        return false;
    }
    
    return true;
});

console.log(`\n✅ Users after cleanup: ${cleanedUsers.length}`);
console.log(`❌ Users removed: ${users.length - cleanedUsers.length}`);

// Создаем backup
const backupFile = path.join(DATA_DIR, `users.backup.${Date.now()}.json`);
fs.writeFileSync(backupFile, JSON.stringify(users, null, 2));
console.log(`\n💾 Backup created: ${backupFile}`);

// Сохраняем очищенный список
fs.writeFileSync(USERS_FILE, JSON.stringify(cleanedUsers, null, 2));
console.log(`✅ Cleaned users saved to: ${USERS_FILE}`);

console.log('\n🎉 Cleanup completed successfully!');

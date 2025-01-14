import { Sequelize } from 'sequelize'; // konfigurowanie połączenia z bazą

// instancja Sequelize
const sequelize = new Sequelize('filmweb', 'springstudent', 'springstudent', {
    host: 'localhost',
    dialect: 'mysql',
});

export default sequelize;

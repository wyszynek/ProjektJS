import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('filmweb', 'springstudent', 'springstudent', {
    host: 'localhost',
    dialect: 'mysql',
});

export default sequelize;

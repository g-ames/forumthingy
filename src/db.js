module.exports = async function () {
    const { Sequelize, DataTypes } = require('sequelize');

    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: 'db.sqlite',
    });

    const User = sequelize.define("User", {
        username: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING(256),
            allowNull: false
        }
    });

    const Thread = sequelize.define("Thread", {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    });

    const Comment = sequelize.define("Comment", {
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    });

    User.hasMany(Thread);
    Thread.belongsTo(User);

    Thread.hasMany(Comment);
    
    Comment.belongsTo(Thread);
    Comment.belongsTo(User);

    await sequelize.sync();

    return { Thread, Comment, User };
}
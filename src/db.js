const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('forum_db', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: './forum_db.sqlite',
    logging: false,
});

const Thread = sequelize.define('Thread', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
});

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    threadId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Thread,
            key: 'id',
        },
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
});

Thread.hasMany(Comment, { foreignKey: 'threadId', as: 'comments' });
Comment.belongsTo(Thread, { foreignKey: 'threadId' });

async function newThread(title) {
    try {
        // Ensure tables are created before any operation
        await sequelize.sync();
        const thread = await Thread.create({ title });
        return thread;
    } catch (error) {
        console.error('Error creating new thread:', error);
        throw error;
    }
}

async function getThreadContents(threadId) {
    try {
        // Ensure tables are created before any operation
        await sequelize.sync();
        const thread = await Thread.findByPk(threadId, {
            include: [{
                model: Comment,
                as: 'comments',
                order: [['createdAt', 'ASC']],
            }],
        });
        return thread;
    } catch (error) {
        console.error('Error getting thread contents:', error);
        throw error;
    }
}

async function getAllThreads() {
    try {
        // Ensure tables are created before any operation
        await sequelize.sync();
        const threads = await Thread.findAll({
            order: [['createdAt', 'DESC']],
        });
        return threads;
    } catch (error) {
        console.error('Error getting all threads:', error);
        throw error;
    }
}

async function addComment(threadId, content) {
    try {
        // Ensure tables are created before any operation
        await sequelize.sync();
        const comment = await Comment.create({ threadId, content });
        return comment;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
}

module.exports = async function() {
    await sequelize.sync();
    return {
        sequelize,
        Thread,
        Comment,
        newThread,
        getThreadContents,
        getAllThreads,
        addComment,
    };
}
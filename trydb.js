// (async function() {
//     const { Thread, Comment, User } = await require("./src/db")();

//     const user = await User.create({
//         username: "Jeff Zamanos",
//         password: "FlippinBread1234!"
//     });

//     const thread = await Thread.create({
//         name: "This is a new thread",
//         description: "This is a very long and nice description about what this thread is about. ".repeat(100),
//         UserId: user.id
//     });

//     const newComment = await Comment.create({
//         ThreadId: thread.id,
//         UserId: user.id,
//         text: "Bam!"
//     });
// })();

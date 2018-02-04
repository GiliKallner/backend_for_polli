const mongoose = require('mongoose');
const Schema = mongoose.Schema;

export const PollOption = new Schema({
        option: { type: String, required: true },
        votes: { type: Number, default: 0 }
});

const poll = new Schema({
        owner: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        question: { type: String, required: true },
        options: [PollOption]
});

poll.set('toJSON', { getters: true, virtual: true });

poll.statics = {

        getPollById: function (pollId, callback) {
                this.findById(pollId).exec(callback);
        },

        getUsersPolls: function (userId, callback) {
                this.find({ owner: userId }, 'question options createdAt').exec(callback);
        },

        saveNewPoll: function (saveData, callback) {
                const { question, options, user_id } = saveData;

                this.create({ question: question, options: options, owner: user_id, createdAt: Date.now() }, (err, created) => {
                        if (err) {
                                console.error('saving error: ', err);throw err;
                        }
                        return created.save(callback);
                });
        },

        updatePoll: function (updatedData, poll_id, callback) {
                let { question, options } = updatedData;

                this.findById(poll_id, (err, poll) => {
                        if (err) return callback(err, null);

                        if (question) poll.question = question;
                        if (options) poll.options = options;

                        poll.save().then(callback);
                });
        },

        deletePoll: function (pollId, callback) {
                this.findById(pollId).remove(callback);
        },

        getPolls: function (options, callback) {
                return this.aggregate([{ $project: {
                                owner: 1,
                                createdAt: 1,
                                options: 1,
                                question: 1,
                                sum: { $sum: '$options.votes' }
                        }
                }].concat(options), (err, polls) => {
                        if (err) return callback(err, null);
                        this.populate(polls, { path: "owner", select: "username -_id" }, callback);
                });
        },

        getAllPolls: function (callback) {
                return this.getPolls([{ $sort: { 'createdAt': -1 } }], callback);
        },

        getRecentPolls: function (callback) {
                return this.getPolls([{ $sort: { 'createdAt': -1 } }, { $limit: 3 }], callback);
        },

        getMostPopularPolls: function (callback) {
                return this.getPolls([{ $sort: { 'sum': -1, 'createdAt': -1 } }, { $limit: 3 }], callback);
        },

        vote: function (poll_id, optionId, callback) {
                this.updateOne({ _id: poll_id, 'options._id': optionId }, { $inc: { 'options.$.votes': 1 } }, callback);
        }

};

export const Poll = mongoose.model('Poll', poll);
//# sourceMappingURL=poll.js.map
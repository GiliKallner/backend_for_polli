'use strict';

Object.defineProperty(exports, "__esModule", {
        value: true
});
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PollOption = exports.PollOption = new Schema({
        option: { type: String, required: true },
        votes: { type: Number, default: 0 }
});

var poll = new Schema({
        owner: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        question: { type: String, required: true },
        options: [PollOption]
});

poll.set('toJSON', { getters: true, virtual: true });

poll.statics = {

        getPollById: function getPollById(pollId, callback) {
                this.findById(pollId).exec(callback);
        },

        getUsersPolls: function getUsersPolls(userId, callback) {
                this.find({ owner: userId }, 'question options createdAt').exec(callback);
        },

        saveNewPoll: function saveNewPoll(saveData, callback) {
                var question = saveData.question,
                    options = saveData.options,
                    user_id = saveData.user_id;


                this.create({ question: question, options: options, owner: user_id, createdAt: Date.now() }, function (err, created) {
                        if (err) {
                                console.error('saving error: ', err);throw err;
                        }
                        return created.save(callback);
                });
        },

        updatePoll: function updatePoll(updatedData, poll_id, callback) {
                var question = updatedData.question,
                    options = updatedData.options;


                this.findById(poll_id, function (err, poll) {
                        if (err) return callback(err, null);

                        if (question) poll.question = question;
                        if (options) poll.options = options;

                        poll.save().then(callback);
                });
        },

        deletePoll: function deletePoll(pollId, callback) {
                this.findById(pollId).remove(callback);
        },

        getPolls: function getPolls(options, callback) {
                var _this = this;

                return this.aggregate([{ $project: {
                                owner: 1,
                                createdAt: 1,
                                options: 1,
                                question: 1,
                                sum: { $sum: '$options.votes' }
                        }
                }].concat(options), function (err, polls) {
                        if (err) return callback(err, null);
                        _this.populate(polls, { path: "owner", select: "username -_id" }, callback);
                });
        },

        getAllPolls: function getAllPolls(callback) {
                return this.getPolls([{ $sort: { 'createdAt': -1 } }], callback);
        },

        getRecentPolls: function getRecentPolls(callback) {
                return this.getPolls([{ $sort: { 'createdAt': -1 } }, { $limit: 3 }], callback);
        },

        getMostPopularPolls: function getMostPopularPolls(callback) {
                return this.getPolls([{ $sort: { 'sum': -1, 'createdAt': -1 } }, { $limit: 3 }], callback);
        },

        vote: function vote(poll_id, optionId, callback) {
                this.updateOne({ _id: poll_id, 'options._id': optionId }, { $inc: { 'options.$.votes': 1 } }, callback);
        }

};

var Poll = exports.Poll = mongoose.model('Poll', poll);
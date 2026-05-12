const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userCollection",
    },
    title: {
        type: String,
    },
    magnetLine: {
        type: String,
    },
    details: {
        type: String
    },
    requirements: {
        type: String
    },
    whatsappGroupLink: {
        type: String,
    },
    instructorsId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "userCollection",
    }],
    banner: {
        type: String,
    },
    videos: [{
        videoTitle: {
            type: String,
        },
        videoLink: {
            type: String,
        },
        // NEW FEATURE: YouTube or uploaded video support
        videoType: {
            type: String,
            enum: ['youtube', 'upload'],
        },
        youtubeUrl: {
            type: String,
        },
        youtubeVideoId: {
            type: String,
        },
        videoFileUrl: {
            type: String,
        },
    }],
    quiz: [{
        ques: {
            type: String,
            required: true,
        },
        options: {
            type: [String],
            validate: {
                validator: (arr) => arr.length === 4,
                message: "A question must have exactly 4 options.",
            },
            required: true,
        },
        ans: {
            type: Number,
            validate: {
                validator: (num) => num >= 0 && num < 4,
                message: "Answer must be between 0 and 3.",
            },
            required: true,
        },
    }],
    startTime: {
        type: Date, // Timestamp for when the student starts the course
    },
    completionTime: {
        type: Date, // Timestamp for when the student completes the course
    },
    category: {
        type: String,
    },
    subCategory: {
        type: String,
    },
    syllabus: {
        type: String,
    },
    keywords: [String],
    paymentMethods: {
        type: [String],
        default: ['online', 'manual'],
    },
    price: {
        type: String,
    },
    discount: {
        type: String,
    },
    students: [{
        studentsId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userCollection",
        },
        paymentId: {
            type: String,
        },
        paymentComplete: {
            type: Boolean,
            default: false
        },
        // NEW FEATURE: Manual payment support
        paymentMethod: {
            type: String,
            enum: ['sslcommerz', 'manual'],
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'approved', 'declined', 'paid'],
        },
        unlockedVideo: {
            type: Number,
            default: 1
        },
        isCourseComplete: {
            type: Boolean,
            default: false
        },
        certificateUrl: {
            type: String,
        },
        quizMarks: {
            type: Number,
            default: 0
        },
        quizMarksPercentage: {
            type: Number,
            default: 0
        },
        isQuizComplete: {
            type: Boolean,
            default: false
        },
    }],
    studentsOpinion: [{
        reviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userCollection",
        },
        rating: {
            type: String, //for rating field
        },
        comments: {
            type: String,
        }
    }],
}, { timestamps: true });

const course = mongoose.model("courseCollection", courseSchema);

module.exports = course;

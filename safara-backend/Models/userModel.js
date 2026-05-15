const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");   // <-- UPDATED HERE
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    gender: {
      type: String,
    },
    birthday: {
      type: String,
    },
    role: {
      type: String,
      required: true,
    },
    prevRole: {
      type: String,
    },
    img: {
      type: String,
      default: "",
    },
    location: {
      type: String,
    },
    profession: [
      {
        position: {
          type: String,
        },
        institution: {
          type: String,
        },
      },
    ],
    degree: {
      type: String,
    },
    result: {
      type: String,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.statics.signup = async function (
  firstname,
  lastname,
  email,
  phone,
  role = "user",
  prevRole = null,
  img,
  password
) {
  const emailExist = await this.findOne({ email });
  if (emailExist) {
    throw Error("This email is already registered");
  }

  const phoneExist = await this.findOne({ phone });
  if (phoneExist) {
    throw Error("This phone number is already registered");
  }

  if (!firstname || !lastname || !email || !phone) {
    throw Error("Required fields must be filled");
  }

  if (!validator.isEmail(email)) {
    throw Error("Invalid email format");
  }

  if (password && !validator.isStrongPassword(password)) {
    throw Error("Password must be at least 8 characters with uppercase, lowercase, number and symbol");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({
    firstname,
    lastname,
    email,
    phone,
    role,
    prevRole,
    img,
    password: hash,
  });

  return user;
};

userSchema.statics.login = async function (email, password) {
    if (!password || !email) {
      throw Error("Please fill in all fields");
    }

    const user = await this.findOne({ email });
    if (!user) {
      throw Error("Email not found. Please sign up first.");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw Error("Incorrect password. Please try again.");
    }

    return user;
};

const user = mongoose.model("userCollection", userSchema);

module.exports = user;

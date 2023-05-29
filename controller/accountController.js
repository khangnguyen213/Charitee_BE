const Account = require("../model/account");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SENDGRID
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API);

// CHECK SESSION
exports.checkSession = (req, res) => {
  if (!req.session.account) {
    return res.sendStatus(404);
  } else {
    return res.status(200).send({
      fullname: req.session.account.fullname,
      role: req.session.account.role,
      _id: req.session.account._id,
    });
  }
};

// CHECK ADMIN
exports.checkAdmin = ({ session }, res, next) => {
  const { role } = session.account || {};
  console.log(role);
  // Check if the role is "admin" or "master"
  switch (role) {
    case "admin":
    case "master":
      // If the role is "admin" or "master", call the next middleware function
      return next();
    default:
      // If the role is not "admin" or "master", send a 403 Forbidden status code
      return res.sendStatus(403);
  }
};

//GET ACCOUNT / ACCOUNTS
exports.getAccount = (req, res, next) => {
  // Define object to hold search conditions
  let findOpts = {};

  // If accountID is provided, only retrieve details if current user matches
  const accountID = req.query.accountID;
  if (accountID) {
    // Check if user is authorized to view account information
    if (req.session.account?._id.toString() === accountID) {
      findOpts._id = accountID;
    } else {
      return res.sendStatus(403);
    }
  }

  // If a keyword is provided, search accounts based on specified terms
  if (req.query.keyword) {
    // Check if user is authorized to view account list
    if (!["admin", "master"].includes(req.session.account?.role)) {
      return res.sendStatus(403);
    }
    // Create regular expression that ignores case of searched terms
    const keywordRegEx = new RegExp(req.query.keyword, "i");
    // Set up search conditions for phone, fullname, and email fields
    findOpts.$or = [
      { phone: { $regex: keywordRegEx } },
      { fullname: { $regex: keywordRegEx } },
      { email: { $regex: keywordRegEx } },
    ];
  }

  // Determine pagination options based on query parameters
  const pageNumber = req.query.pageNumber ? +req.query.pageNumber : 0;
  const nPerPage = req.query.nPerPage ? +req.query.nPerPage : 15;
  const skip = pageNumber > 0 ? (pageNumber - 1) * nPerPage : 0;

  // Set up queries to retrieve paginated account details and count total results
  const findPromise = Account.find(
    {
      ...findOpts,
      status: { $in: ["active"] },
    },
    //Only return these value (not include password)
    "email fullname phone address role"
  )
    //skip a number of documents
    .skip(skip)
    //only return a nPerPage number of documents
    .limit(nPerPage);

  //Promise to count the total satisfied documents
  const countPromise = Account.countDocuments({
    ...findOpts,
    status: { $in: ["active"] },
  });

  // Retrieve results from both findPromise and countPromise
  // and handle them accordingly
  Promise.all([findPromise, countPromise])
    .then(([results, count]) => {
      // Set up response object with current page, total pages, and paginated account details
      const responseDate = {
        currentPage: pageNumber > 0 ? pageNumber : 1,
        totalPage: Math.ceil(count / nPerPage),
        accounts: results,
      };
      return res.send(responseDate);
    })
    .catch((error) => {
      // Handle errors by sending an HTTP 500 status code
      return res.sendStatus(500);
    });
};

//SEND VERIFY ACCOUNT EMAIL
async function sendEmail(account) {
  // Construct the email template data
  const template_data = {
    fullname: account.fullname,
    confirmUrl: `${process.env.BASE_FRONTEND_API}/confirm/${account._id}`,
  };

  try {
    // Send the email using SendGrid API
    await sgMail.send({
      to: account.email,
      from: process.env.SENDER_EMAIL,
      subject: "Verify your registration",
      templateId: "d-b63496460c45454a9b31a8d20ea9ac82",
      dynamicTemplateData: template_data,
    });
  } catch (error) {
    throw error;
  }
}

// ADD ACCOUNT
exports.addAccount = async (req, res, next) => {
  try {
    // Check if an account with the specified email already exists
    const existingAccount = await Account.findOne({ email: req.body.email });

    if (existingAccount) {
      // Return a 402 status code if the email is already taken
      res.statusCode = 402;
      res.statusMessage = "This email already exists";
      return res.end();
    }

    // Create a new account instance and save it to the database
    const newAccount = new Account({
      ...req.body,
      password: bcrypt.hashSync(req.body.password, 12),
    });
    const savedAccount = await newAccount.save();

    // Throw an error if the account wasn't saved successfully
    if (!savedAccount) {
      throw new Error("Failed to create account");
    }

    // Send a verification email to the newly created account
    await sendEmail(savedAccount);

    return res.sendStatus(201);
  } catch (error) {
    // Handle any errors and return a 500 status code
    return res.sendStatus(500);
  }
};

//VERIFY ACCOUNT
exports.verifyAccount = async (req, res) => {
  try {
    // Find the account by ID in the request parameters
    const accountID = req.params.accountID;
    const account = await Account.findById(accountID);

    // Return a 404 error if the account doesn't exist or is not pending
    if (!account || account.status !== "pending") {
      return res.sendStatus(404);
    }

    // Activate the account and save it to the database
    account.status = "active";
    await account.save();

    // Return a 200 status code on success
    return res.sendStatus(200);
  } catch (error) {
    // Handle any errors and return a 500 status code
    return res.status(500).send(error.toString());
  }
};

//UPDATE ACCOUNT
exports.updateAccount = async (req, res) => {
  try {
    // Find the account by ID in the request parameters
    const accountID = req.params.id;
    // Only user with matched session ID can update account
    if (req.session.account._id.toString() !== accountID) {
      return res.sendStatus(401);
    }
    const account = await Account.findById(accountID);

    // Return a 404 error if the account doesn't exist
    if (!account) {
      return res.sendStatus(404);
    }

    // Update the account properties and save it to the database
    account.fullname = req.body.fullname || account.fullname;
    account.address = req.body.address || account.address;
    account.phone = req.body.phone || account.phone;

    const savedAccount = await account.save();

    // Throw an error if the account wasn't saved successfully
    if (!savedAccount) {
      throw new Error("Failed to update account");
    }

    // Send a success response with the updated account data
    return res.status(200).json(savedAccount);
  } catch (error) {
    // Handle any errors and return a 500 status code
    return res.status(500).send(error.toString());
  }
};

//FORGET PASSWORD
//1.SEND RESET PASSWORD MAIL
exports.requestResetPassword = async (req, res) => {
  try {
    // Try to find an Account document with the given email address
    const account = await Account.findOne({ email: req.body.email });
    if (!account) {
      // If no such document exists, send a 404 response
      return res.status(404).send("Email not found");
    }
    // Generate a JSON Web Token (JWT) containing the account's ID
    const token = jwt.sign({ _id: account._id }, "secret-key", {
      expiresIn: 60 * 10, // Token expires in 10 minutes
    });
    // Define the data to be included in the email template
    const template_data = {
      fullname: account.fullname,
      resetpasswordURL: `${process.env.BASE_FRONTEND_API}/reset-password/${token}`,
    };
    // Use SendGrid to send an email to the account's email address
    await sgMail.send({
      to: account.email,
      from: "khangnguyeniz1010@gmail.com",
      subject: "Reset Password Confirmation",
      templateId: "d-8f56f1660ba647218fb88965927ae376",
      dynamicTemplateData: template_data,
    });
    // If the email is sent successfully, send a 200 response

    return res.sendStatus(200);
  } catch (error) {
    // If there's any error, send a 500 response
    return res.sendStatus(500);
  }
};
//2.VERIFY EMAIL TO RESET
exports.verifyResetPassword = async (req, res) => {
  try {
    // Verify JWT token
    const payload = jwt.verify(req.body.token, "secret-key");
    // Find account by ID from token payload
    const account = await Account.findById(payload._id);
    if (!account) {
      // If account not found, return 404
      return res.status(404).send("This link has expired");
    }
    // Check if new password is same as old password
    if (bcrypt.compareSync(req.body.password, account.password)) {
      return res
        .status(406)
        .send("The new password is the same as the old one");
    }
    // Hash new password and save it to account
    account.password = bcrypt.hashSync(req.body.password, 12);
    await account.save();
    // Password update successful, send HTTP status 200
    return res.sendStatus(200);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // Handle expired token error
      return res.status(404).send("This link has expired");
    } else {
      // Handle other errors
      return res.sendStatus(500);
    }
  }
};

// DELETE ACCOUNT
exports.deleteAccount = (req, res) => {
  // Update account whose IDs are included in the request body to have a status of "inactive"
  Account.updateMany({ _id: { $in: req.body } }, { status: "inactive" }).then(
    (data) => {
      // If any accounts were successfully updated, send a response with a success status code and message
      if (data.modifiedCount > 0) {
        return res.status(200).send(`Updated ${data.modifiedCount} item(s)`);
      } else {
        // Otherwise, send a 404 status code to indicate that no accounts were found or modified
        return res.sendStatus(404);
      }
    }
  );
};

// CHANGE ROLE
exports.changeRole = (req, res) => {
  // If the currently authenticated user's role is not "master", send a 401 status code
  // Only master can change role
  if (req.session.account.role !== "master") {
    return res.sendStatus(401);
  }

  let updatedRole;
  // Determine the updated role based on the value of the "role" property in the request body
  if (req.body.role === "admin") {
    updatedRole = "user";
  } else if (req.body.role === "user") {
    updatedRole = "admin";
  } else if (req.body.role === "master") {
    // If the requested role update is for a "master" role, send a 403 status code and error message
    return res.status(403).send("Master's role cannot be updated");
  }
  // Update the role of the account with the specified ID to the new role
  Account.updateMany(
    { _id: { $in: [req.body.accountID] } },
    { role: updatedRole }
  )
    .then((data) => {
      // If any accounts were successfully updated, send a response with a success status code and message
      if (data.modifiedCount > 0) {
        return res.status(200).send(`Updated ${data.modifiedCount} item(s)`);
      } else {
        // Otherwise, send a 404 status code to indicate that no accounts were found or modified
        return res.sendStatus(404);
      }
    })
    .catch((err) => res.status(500).send(err.toString()));
};

// LOGIN
exports.login = async (req, res) => {
  try {
    // Find an account with the email provided in the request body
    const result = await Account.findOne({ email: req.body.email });

    // If an account is found and its password matches the hash in the database
    if (result && bcrypt.compareSync(req.body.password, result.password)) {
      // If the account's status is "active"
      if (result.status === "active") {
        // Set the account information as the value of the "account" key in the session object
        req.session.account = result;

        // Extract the fullname, role, and _id fields from the account object and send them as a response
        const { fullname, role, _id } = result;
        return res.status(200).send({
          fullname,
          role,
          _id,
        });
      }

      // If the account's status is "pending"
      if (result.status === "pending") {
        // Send a response indicating that the account is pending and needs email verification
        return res
          .status(403)
          .send("This account is pending. Please verify your email");
      }
    } else {
      // If no account is found or the passwords don't match, throw an error
      throw new Error("Email or Password not correct");
    }
  } catch (err) {
    // If there is an error, return a 401 status code and the error message as a string
    return res.status(401).send(err.toString());
  }
};

//LOGOUT
exports.logout = (req, res) => {
  req.session.destroy(() => {
    return res.sendStatus(200);
  });
};

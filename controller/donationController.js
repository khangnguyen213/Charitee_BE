const paypal = require("paypal-rest-sdk");
paypal.configure({
  mode: "sandbox", // Use sandbox for testing environment
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

const Donation = require("../model/donation");
const Cause = require("../model/cause");
const Account = require("../model/account");

exports.getDonation = async (req, res, next) => {
  // Define object to hold search conditions
  let findOpts = {};
  // If accountID is provided, only retrieve details if current user matches
  if (req.query.accountID) {
    if (req.query.accountID === req.session.account?._id.toString()) {
      findOpts.accountID = req.query.accountID;
    }

    // If a keyword is provided, search donations based on specified terms
  } else if (req.query.causeSearch || req.query.donatorSearch) {
    // Check if user is authorized to view account list
    if (!["admin", "master"].includes(req.session.account?.role)) {
      return res.sendStatus(403);
    }
    const donatorsQuery = [];
    const causesQuery = [];
    if (req.query.donatorSearch) {
      const accounts = await Account.find({
        fullname: { $regex: new RegExp(req.query.donatorSearch, "i") },
      });
      accounts.forEach((account) => donatorsQuery.push(account._id));
    }
    if (req.query.causeSearch) {
      const causes = await Cause.find({
        title: { $regex: new RegExp(req.query.causeSearch, "i") },
      });
      causes.forEach((cause) => causesQuery.push(cause._id));
    }

    if (req.query.donatorSearch && req.query.causeSearch) {
      findOpts.$and = [
        { accountID: { $in: donatorsQuery } },
        { causeID: { $in: causesQuery } },
      ];
    } else {
      findOpts.$or = [
        { accountID: { $in: donatorsQuery } },
        { causeID: { $in: causesQuery } },
      ];
    }
  }

  // Determine pagination options based on query parameters
  const pageNumber = req.query.pageNumber ? +req.query.pageNumber : 0;
  const nPerPage = req.query.nPerPage ? +req.query.nPerPage : 15;
  const skip = pageNumber > 0 ? (pageNumber - 1) * nPerPage : 0;

  // Set up queries to retrieve paginated donation details and count total results
  const findPromise = Donation.find(findOpts)
    .populate({ path: "causeID", select: "_id title" })
    .populate({ path: "accountID", select: "_id email fullname phone" })
    .sort({ donatedAt: -1 }) // Sort by createdAt field in descending order (-1)
    //skip a number of documents
    .skip(skip)
    //only return a nPerPage number of documents
    .limit(nPerPage);

  //Promise to count the total satisfied documents
  const countPromise = Donation.countDocuments(findOpts);

  // Retrieve results from both findPromise and countPromise
  // and handle them accordingly
  Promise.all([findPromise, countPromise])
    .then(([results, count]) => {
      // Set up response object with current page, total pages, and paginated account details
      const responseDate = {
        currentPage: pageNumber > 0 ? pageNumber : 1,
        totalPage: Math.ceil(count / nPerPage),
        results,
      };
      return res.send(responseDate);
    })
    .catch((error) => {
      // Handle errors by sending an HTTP 500 status code
      return res.sendStatus(500);
    });
};

exports.createPayment = function (req, res) {
  const { price, causeID, description, returnUrl, cancelUrl } = req.body; // get price and description from request body

  // Build PayPal API request object
  const paymentDetail = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
    transactions: [
      {
        amount: {
          total: price,
          currency: "USD", // replace with your currency code
        },
        description: `${description} #${causeID}`,
      },
    ],
  };
  // Call PayPal API to create payment
  paypal.payment.create(paymentDetail, function (error, payment) {
    if (error) {
      console.dir(error.response.details);
      return res.status(500).json({ error: "Unable to create PayPal payment" });
    } else {
      // Redirect user to PayPal approval URL
      const approvalUrl = payment.links.find(
        (link) => link.rel === "approval_url"
      ).href;
      res.json({ approvalUrl: approvalUrl });
    }
  });
};

exports.executePayment = (req, res) => {
  const { paymentId, payerId } = req.body; // get payment ID and payer ID from request body
  if (!req.session.account) {
    return res.sendStatus(404);
  }
  // Execute the PayPal payment
  paypal.payment.execute(paymentId, { payer_id: payerId }, (error, payment) => {
    if (error) {
      return res
        .status(500)
        .json({ error: "Unable to execute PayPal payment" });
    }

    // Payment was successful!
    const causeID = payment.transactions[0].description.split("#")[1];
    const donation = new Donation({
      amount: +payment.transactions[0].amount.total,
      accountID: req.session.account._id,
      causeID,
    });

    donation
      .save()
      .then((donation) => {
        if (donation) {
          Cause.findById(donation.causeID).then((cause) => {
            cause.raised += donation.amount;
            if (cause.raised >= cause.goal) {
              cause.status = "finish";
            }
            cause.save().then((cause) => {
              if (cause) {
                res.json({ success: true });
              }
            });
          });
        }
      })
      .catch((err) => {
        res.status(500).send(err.toString());
      });
  });
};

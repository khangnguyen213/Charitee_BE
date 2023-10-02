const Cause = require('../model/cause');

// GET CAUSE
exports.getCause = (req, res) => {
  // Initialize an empty object to hold options for querying
  let findOpts = {};

  // If there is a causeID in the query parameters, add it as a filter.
  if (req.query.causeID) {
    findOpts._id = req.query.causeID;
  }
  // If there is a keyword in the query parameters, construct a regex to search
  // for titles and descriptions that match that keyword.
  if (req.query.keyword) {
    const keywordRegEx = new RegExp(req.query.keyword, 'i');
    findOpts.$or = [
      { title: { $regex: keywordRegEx } },
      { description: { $regex: keywordRegEx } },
      {
        $and: [
          { title: { $not: { $eq: null } } },
          { description: { $not: { $eq: null } } },
          {
            $or: [
              { title: { $regex: keywordRegEx } },
              { description: { $regex: keywordRegEx } },
            ],
          },
        ],
      },
    ];
  }

  // configure pagination options
  const pageNumber = req.query.pageNumber ? +req.query.pageNumber : 0;
  const nPerPage = req.query.nPerPage ? +req.query.nPerPage : 15;
  const skip = pageNumber > 0 ? (pageNumber - 1) * nPerPage : 0;

  //promise to find documents base on findOpts
  const findPromise = Cause.find({
    ...findOpts,
    status: { $in: ['active', 'finished'] },
  })
    .sort({ createdAt: -1 }) // Sort by createdAt field in descending order (-1)
    .skip(skip)
    .limit(nPerPage);

  //promise to count documents base on findOpts
  const countPromise = Cause.countDocuments({
    ...findOpts,
    status: { $in: ['active', 'finished'] },
  });

  //handle both find and count promise and response
  Promise.all([findPromise, countPromise])
    .then(([results, count]) => {
      // Handle paginated results and total count here
      const responseDate = {
        currentPage: pageNumber > 0 ? pageNumber : 1,
        totalPage: Math.ceil(count / nPerPage),
        causes: results,
        count,
      };
      return res.send(responseDate);
    })
    .catch((error) => {
      // Handle error here
      return res.sendStatus(500);
    });
};

// ADD CAUSE
exports.addCause = (req, res) => {
  Cause.findOne({ title: req.body.title }).then((data) => {
    // The cause title must be unique to not confuse donator
    // If title not exist before, create
    if (!data) {
      const cause = new Cause({
        title: req.body.title,
        description: req.body.description,
        goal: req.body.goal,
        raised: req.body.raised,
        finishAt: new Date(req.body.finishAt),
        image: req.body.image,
      });
      cause
        .save()
        .then((cause) => {
          if (cause) {
            // if cause created success, send an HTTP status 201 mean created
            res.status(201).send(cause._id);
          }
        })
        .catch((err) => res.sendStatus(500));
    } else {
      // if title existed, send an HTTP status 402
      res.statusCode = 402;
      res.statusMessage =
        "The cause's title already exist - which may confuse donors";
      return res.end();
    }
  });
};

// UPDATE CAUSE
exports.updateCause = (req, res) => {
  Cause.findOne({ _id: req.body.causeID }).then((cause) => {
    if (!cause) {
      // if no cause found send an HTTP status 404 (Not found)
      return res.sendStatus(404);
    } else {
      // Update data base on req.body
      if (req.body.description) {
        cause.description = req.body.description;
      }
      if (req.body.goal) {
        cause.goal = req.body.goal;
      }
      if (req.body.finishAt) {
        cause.finishAt = new Date(req.body.finishAt);
      }
      if (req.body.image) {
        cause.image = req.body.image;
      }

      cause
        .save()
        .then((cause) => {
          if (cause) {
            // If cause updated successfyl, send an HTTP status 200
            res.status(200).send(cause._id);
          }
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    }
  });
};

// DELETE CAUSE
exports.deleteCause = (req, res) => {
  //find causes base on req.body, delete them by change status to inactive
  Cause.updateMany({ _id: { $in: req.body } }, { status: 'inactive' }).then(
    (data) => {
      if (data.modifiedCount > 0) {
        return res.status(200).send(`Updated ${data.modifiedCount} item(s)`);
      } else {
        return res.sendStatus(404);
      }
    }
  );
};

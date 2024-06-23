const Tour = require('../models/tourModel');

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan1 = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      // {
      //   $group: {
      //     month: { $month: '$startDates' },
      //     numTourStarts: { $sum: 1 },
      //     tours: { $push: '$name' },
      //   },
      // },

      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    const plan2 = await Tour.aggregate([
      // Match documents with startDates in the year 2022
      {
        $match: {
          startDates: {
            $elemMatch: {
              $gte: new Date(`${year}-01-01`),
              $lt: new Date(`${year + 1}-01-01`),
            },
          },
        },
      },
      // Unwind the startDates array to process each date individually
      { $unwind: '$startDates' },
      // Extract the month from the start date
      { $addFields: { month: { $month: '$startDates' } } },
      // Group documents by month and count the occurrences
      {
        $group: {
          _id: '$month',
          count: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      // Sort the results by count in descending order
      { $sort: { count: -1 } },
      // Limit to the first document (busiest month)
      { $limit: 1 },
    ]);

    res.status(200).json({
      status: 'success',
      result: plan1.length,

      data: {
        plan1,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err,
    });
  }
};

exports.getTours = async (req, res) => {
  try {
    // Build query
    // 1A Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    console.log(
      `Query: ${JSON.stringify(queryObj)} ; Type: ${typeof JSON.stringify(queryObj)}`,
    );

    // 1B advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|lte|gt|lt)\b/g, (match) => `$${match}`);
    console.log(queryStr);
    console.log(JSON.parse(queryStr));

    let query = Tour.find(JSON.parse(queryStr));
    // 2 Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      console.log(`sortBy : ${sortBy}`);
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    // 3 Field limiting , by using query or set in model
    if (req.query.fields) {
      console.log(`Field: ${req.query.fields.replace(',', ' ')}`);
      query = query.select(req.query.fields.replace(',', ' '));
    } else {
      query = query.select('-__v');
    }

    // Exec query
    const tours = await query;

    // Send response
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      result: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err,
    });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (e) {
    res.status(400).json({
      status: 'failed',
      message: e,
    });
  }
};

exports.addTour = async (req, res) => {
  try {
    console.log(req.body);
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      tour: newTour,
    });
  } catch (e) {
    res.status(400).json({
      status: 'failed',
      message: e,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        status: 'success',
        tour: updatedTour,
      },
    });
  } catch (e) {
    res.status(400).json({
      status: 'failed',
      message: e,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    // await Tour.deleteOne({ _id: req.params.id });
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      // No Content success
      status: 'success',
      data: null,
    });
  } catch (e) {
    res.status(400).json({
      status: 'failed',
      message: e,
    });
  }
  // Tour.deleteOne({ _id: req.params.id });
  // res.status(204).json({
  //   // No Content success
  //   status: 'success',
  //   data: { status: 'hi hi' },
  // });
};

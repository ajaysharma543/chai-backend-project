const subscribeToChannel = asyncHandler(async (req, res) => {
const subscriberId = req.user._id;          // logged-in user
const channelId = req.params.channelId;     // the channel to subscribe to

// Prevent subscribing to self
if(subscriberId.toString() === channelId){
throw new ApiError(400, "You cannot subscribe to yourself");
}

// Check if subscription already exists
const existing = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });
if(existing){
throw new ApiError(400, "Already subscribed");
}

// Create new subscription
const subscription = await Subscription.create({
subscriber: subscriberId,
channel: channelId,
createdAt: new Date()
});

res.status(200).json({ message: "Subscribed successfully", subscription });
});

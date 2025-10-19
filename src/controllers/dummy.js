const subscribeToChannel = asyncHandler(async (req, res) => {
const subscribedId = req.user._id;      // person who subscribes
const channelId = req.params.channelId; // ✅ matches route param

if (subscribedId.toString() === channelId) {
throw new ApiError(400, "You cannot subscribe to yourself");
}

const existing = await Subscription.findOne({
subscriber: subscribedId,
channel: channelId,
});

if (existing) {
throw new ApiError(400, "Already subscribed");
}

const subscription = await Subscription.create({
subscriber: subscribedId,
channel: channelId,
});

res
.status(200)
.json(new ApiResponse(200, subscription, "Subscribed successfully"));
});

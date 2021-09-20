const { User, Thought } = require('../models'); // our thought model so we can use it to query thought .find from our typeDefs
// if theres a login duplicate 
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');


// our response to type def query helloworld
const resolvers = {
    Query: {
        thoughts: async (parent, { username }) => {
            const params = username ? { username } : {};
            return Thought.find(params).sort({ createdAt: -1 });
        },
           // place this inside of the `Query` nested object right after `thoughts` 
thought: async (parent, { _id }) => {
    return Thought.findOne({ _id });
  },

            // get all users
users: async () => {
    return User.find()
      .select('-__v -password')
      .populate('friends')
      .populate('thoughts');
  },
  // get a user by username
  user: async (parent, { username }) => {
    return User.findOne({ username })
      .select('-__v -password')
      .populate('friends')
      .populate('thoughts');
  },
      me: async (parent, args, context)=> {
       if(context.user) {const userData = await User.findOne({_id: context.user._id}).select('-__v -password')
       .populate('thoughts')
       .populate('friends');
 
     return userData;

       } 
     throw new AuthenticationError('not logged in')
    }
  },
    Mutation: {
      addUser: async (parent, args) => {
        const user = await User.create(args);
        const token = signToken(user);
        return {token, user};
      },
      login: async (parent, { email, password}) => {
        const user = await User.findOne({email});

        if(!user) {
          throw new AuthenticationError('incorrect credentials ')  // using the variable at top of file to throw error if theres a dup email user
        }
        const correctPw = await user.isCorrectPassword(password);

        if (!correctPw) {
          throw new AuthenticationError('incorrect credentials')
        } 

        const token = signToken(user);
        return {token, user};  // if no errors return the user find one email 

      },
      addThought: async(parent, args, context) => {
        if(context.user)// will only be able to get to add thought if theyre logged in context holds username email and id 
        {
          const thought = await Thought.create({...args, username: context.user.username})

          await User.findByIdAndUpdate({_id: context.user._id}, { $push: { thoughts: thought._id}}, {new: true}); // without new : true mongo wouldnt update the document
          return thought;
        }
        throw new AuthenticationError('you need to be logged in!')
      },
      addReaction: async (parent, { thoughtId, reactionBody }, context) => {
        if (context.user) {
          const updatedThought = await Thought.findOneAndUpdate(
            { _id: thoughtId },
            { $push: { reactions: { reactionBody, username: context.user.username } } },
            { new: true, runValidators: true }
          );
      
          return updatedThought;
        }
      
        throw new AuthenticationError('You need to be logged in!');
      },
      addFriend: async (parent, { friendId}, context) => {
        if(context.user){
          const updatedUser = await User.findOneAndUpdate(
            {_id: context.user.id},
            {$addToSet: { friends: friendId } },
            {new: true}
          ).populate('friends');
          return updatedUser;
          
        }
        throw new AuthenticationError('you need to be logged in')
      }
    }
  }


module.exports = resolvers;
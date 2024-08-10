const { UserData } = require("../Models")

exports.addUser = async(req, res) => {
  const { userId: userId, name: name, email: email } = req.body
  console.log("Adding new user", userId, name)
  try {
    await UserData.findOneAndUpdate({
      name: name,
      userId: userId,
      email: email,
    })
    res.sendStatus(200) // Ok!
  } catch(error) {
    console.error("Failed to add user", userId, name, email, error)
    res.sendStatus(404)
  }
}
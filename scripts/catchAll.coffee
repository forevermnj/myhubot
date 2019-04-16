module.exports = (robot) ->
  robot.catchAll (res) ->
    res.send "Nothing Found：#{res.message.text}"
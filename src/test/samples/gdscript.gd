extends StaticBody2D

# ! class member variables go here
var a = 2
var b = "textvar"

func _ready():
    # * Called when the node is added to the scene for the first time.
    # ? is this loop necessary?
	for i in range(20):
	    print(i)

func _process(delta):
    # TODO: Add logic
    # Called every frame. Delta is time since last frame.
    # Update game logic here.
    pass


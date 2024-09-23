# -*- encoding: utf-8 -*-

# Force load of resources so that Qt can see them:
from .resources import *  # noqa

from .IntoTheRadius import IntoTheRadiusPlugin


def createPlugin():
    print("Creating IntoTheRadiusPlugin")
    return IntoTheRadiusPlugin()

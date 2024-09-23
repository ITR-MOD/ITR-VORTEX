MO2 ?= E:/Modding/MO2

default: mo2-setup mo2-assets

mo2-reload: mo2-install
	$(MO2)/ModOrganizer.exe --logs
mo2-uninstall:
	-rm -r $(MO2)/plugins/IntoTheRadius

mo2-install: mo2-uninstall
	-mkdir -p $(MO2)/plugins/IntoTheRadius
	cp ./*.py $(MO2)/plugins/IntoTheRadius/
	cp -r ../assets $(MO2)/plugins/IntoTheRadius/

mo2-assets:
	pyside6-rcc -o resources.py resources.qrc
	sed -i "s/from PySide6 import QtCore/from PyQt6 import QtCore/g" resources.py
mo2-setup:
	pip install -r requirements.txt
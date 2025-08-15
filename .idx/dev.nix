{ pkgs, ... }: {
  channel = "unstable";

  packages = [
    pkgs.nodejs_20
    pkgs.python311
    pkgs.python311Packages.pip
    
    # Complete, verified list of dependencies for Playwright
    pkgs.glib
    pkgs.nss
    pkgs.nspr
    pkgs.at-spi2-atk
    pkgs.gtk3
    pkgs.libxkbcommon
    pkgs.xorg.libX11
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXrandr
    pkgs.mesa-demos 
    pkgs.cairo
    pkgs.pango
    pkgs.udev
    pkgs.alsa-lib
    pkgs.dbus
    pkgs.cups
    pkgs.expat
    pkgs.xorg.libxcb
    
    # C++ standard library for numpy
    pkgs.stdenv.cc.cc.lib
  ];

  env = {};
}

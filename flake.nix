{
  description = "A nix shell development";
  inputs = {
    nixpkgs.url = "https://github.com/NixOS/nixpkgs/tarball/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = {self, nixpkgs, flake-utils}: 
    flake-utils.lib.eachDefaultSystem (system:
        let pkgs = nixpkgs.legacyPackages.${system}; in 
        with pkgs;
        {
          devShells.default = mkShell {
            nativeBuildInputs = [pkg-config];
              buildInputs = [
                nodejs_20
                iconv
              ];
          };
        }
      );
  }

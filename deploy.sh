#!/bin/sh

# build the contract
npm run build

# deploy the contract
echo "Tipo de despliegue"
select option in Dev Account
do
        case $option in
                Dev)
                        near dev-deploy --wasmFile contract/build/contract.wasm; break;;
                Account)
                        echo Ingrese la cuenta:
                        read account
                        near deploy $account --wasmFile contract/build/contract.wasm; break;;
        esac
done
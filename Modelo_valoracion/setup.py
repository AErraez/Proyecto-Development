from setuptools import setup, find_packages

setup(
    name="player_value_model",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        "player_value_model": [
            "*.pkl",
            "*.json",
        ]
    },
)

import * as path from "path";

export class XcodeSelectService implements IXcodeSelectService {
	private _xcodeVerionCache: IVersionData;

	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $injector: IInjector) {
	}

	public getDeveloperDirectoryPath(): IFuture<string> {
		return (() => {
			if (!this.$hostInfo.isDarwin) {
				this.$errors.failWithoutHelp("xcode-select is only available on Mac OS X.");
			}

			let childProcess = this.$childProcess.spawnFromEvent("xcode-select", ["-print-path"], "close", {}, { throwError: false }).wait(),
				result = childProcess.stdout.trim();

			if (!result) {
				this.$errors.failWithoutHelp("Cannot find path to Xcode.app - make sure you've installed Xcode correctly.");
			}

			return result;
		}).future<string>()();
	}

	public getContentsDirectoryPath(): IFuture<string> {
		return (() => {
			return path.join(this.getDeveloperDirectoryPath().wait(), "..");
		}).future<string>()();
	}

	public getXcodeVersion(): IFuture<IVersionData> {
		return ((): IVersionData => {
			if (!this._xcodeVerionCache) {
				let sysInfoBase = this.$injector.resolve("sysInfoBase");
				let xcodeVer = sysInfoBase.getXCodeVersion().wait(),
					xcodeVersionMatch = xcodeVer.match(/Xcode (.*)/),
					xcodeVersionGroup = xcodeVersionMatch && xcodeVersionMatch[1],
					xcodeVersionSplit = xcodeVersionGroup && xcodeVersionGroup.split(".");

					this._xcodeVerionCache = {
						major: xcodeVersionSplit && xcodeVersionSplit[0],
						minor: xcodeVersionSplit && xcodeVersionSplit[1],
						patch: xcodeVersionSplit && xcodeVersionSplit[2]
					};
			}

			return this._xcodeVerionCache;
		}).future<IVersionData>()();
	}
}

$injector.register("xcodeSelectService", XcodeSelectService);

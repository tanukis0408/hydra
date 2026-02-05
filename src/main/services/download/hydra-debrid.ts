import { KrakenApi } from "../hydra-api";

export class KrakenDebridClient {
  public static getAvailableMagnets(
    magnets: string[]
  ): Promise<Record<string, boolean>> {
    return KrakenApi.put(
      "/debrid/check-availability",
      {
        magnets,
      },
      { needsAuth: false }
    );
  }

  public static async getDownloadUrl(magnet: string) {
    try {
      const response = await KrakenApi.post<{ downloadUrl: string | null }>(
        "/debrid/request-file",
        {
          magnet,
        }
      );

      return response.downloadUrl ?? null;
    } catch (error) {
      return null;
    }
  }
}
